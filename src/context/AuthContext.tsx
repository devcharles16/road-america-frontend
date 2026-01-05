import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { clearAdminKey } from "../utils/adminAuth";

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role | undefined; // undefined = loading role for logged-in user
  roleError: string | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRole(input: any): Role {
  const r = String(input ?? "").trim().toLowerCase();
  if (r === "admin" || r === "employee" || r === "client") return r as Role;
  return null;
}

async function upsertProfileDefaultClient(u: any) {
  if (!u?.id) return;

  const payload: any = {
    id: u.id,
    email: u.email ?? null,
    role: "client",
    updated_at: new Date().toISOString(),
  };

  // NOTE: requires profiles.id to be UNIQUE/PK to dedupe correctly
  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

function clearSupabaseAuthStorage() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      sessionStorage.removeItem(key);
    }
  }
}

function withTimeout<T>(
  p: PromiseLike<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`[Auth] Timeout in ${label} after ${ms}ms`));
    }, ms);

    Promise.resolve(p)
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role | undefined>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Loading is driven by a counter so it can’t get stuck true
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(0);

  // Dev-only: protect against StrictMode double-effect init
  const didInitRef = useRef(false);

  const begin = useCallback((label: string) => {
    pendingRef.current += 1;
    console.log("[Auth begin]", label, "pending =", pendingRef.current);
    setLoading(true);
  }, []);

  const end = useCallback((label: string) => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    console.log("[Auth end]", label, "pending =", pendingRef.current);
    setLoading(pendingRef.current > 0);
  }, []);

  const reqIdRef = useRef(0);
  const isLoggingOutRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(null);
  const lastGoodRoleRef = useRef<Role>(null);

  const setLoggedOut = useCallback((err: string | null = null) => {
    // Ensure we never remain "loading" while logged out
    pendingRef.current = 0;
    setLoading(false);

    setUser(null);
    setRole(null);
    setRoleError(err);

    activeUserIdRef.current = null;
    lastGoodRoleRef.current = null;
  }, []);

  const applyRoleSafely = useCallback((userId: string, nextRole: Role) => {
    if (isLoggingOutRef.current) return;
    if (activeUserIdRef.current !== userId) return;

    lastGoodRoleRef.current = nextRole;
    setRoleError(null);
    setRole(nextRole);
  }, []);

  const applyRoleFetchError = useCallback((userId: string, message: string) => {
    if (isLoggingOutRef.current) return;
    if (activeUserIdRef.current !== userId) return;

    setRoleError(message);

    // ✅ TIMEOUTS should not "downgrade" you to no-role.
    // Keep role as "loading" so guards don't redirect to client login.
    if (String(message).includes("Timeout in profiles(role)")) {
      setRole(undefined);
      return;
    }

    // Keep a known role if we already have one; otherwise fall back to last good role.
    setRole((prev) => {
      if (prev !== null && prev !== undefined) return prev; // keep admin/employee/client
      return lastGoodRoleRef.current; // may be null, but won't downgrade an existing role
    });
  }, []);

  const fetchRoleForUser = useCallback(
    async (u: any) => {
      if (!u?.id) {
        setRole(null);
        setRoleError("Missing user id.");
        return;
      }

      const userId = String(u.id);

      try {
        const { data, error } = await withTimeout(
          supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
          15000, // ✅ was 8000
          "profiles(role)"
        );

        if (isLoggingOutRef.current) return;
        if (activeUserIdRef.current !== userId) return;

        if (error) {
          applyRoleFetchError(userId, error.message);
          return;
        }

        // No profile row (or RLS returns null)
        if (!data) {
          try {
            await upsertProfileDefaultClient(u);
          } catch (e: any) {
            applyRoleFetchError(
              userId,
              e?.message || "Failed to create default profile."
            );
            return;
          }

          const { data: retryData, error: retryErr } = await withTimeout(
            supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
            15000, // ✅ was 8000
            "profiles(role) retry"
          );

          if (isLoggingOutRef.current) return;
          if (activeUserIdRef.current !== userId) return;

          if (retryErr) {
            applyRoleFetchError(userId, retryErr.message);
            return;
          }

          if (!retryData) {
            applyRoleFetchError(
              userId,
              "Profile row missing or access denied (RLS)."
            );
            return;
          }

          const normalized = normalizeRole(retryData.role);
          applyRoleSafely(userId, normalized);
          return;
        }

        const normalized = normalizeRole(data.role);
        applyRoleSafely(userId, normalized);
      } catch (e: any) {
        applyRoleFetchError(userId, e?.message || "Failed to load role.");
      }
    },
    [applyRoleFetchError, applyRoleSafely]
  );

  const hydrateFromSession = useCallback(
    async (session: any) => {
      if (isLoggingOutRef.current) return;

      const u = session?.user ?? null;
      if (!u) {
        setLoggedOut(null);
        return;
      }

      const userId = String(u.id);

      // ✅ If it's the same user and role is already known (admin/employee/client OR null),
      // don't wipe role / refetch on benign auth events.
      if (activeUserIdRef.current === userId && role !== undefined) {
        setUser(u);
        return;
      }

      setUser(u);
      activeUserIdRef.current = userId;
      setRoleError(null);

      // Role is loading
      setRole(undefined);

      await fetchRoleForUser(u);
    },
    [fetchRoleForUser, role, setLoggedOut]
  );

  // Manual retry (useful for a "Retry" button)
  const refreshAuth = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    begin("refreshAuth");

    try {
      if (isLoggingOutRef.current) {
        setLoggedOut(null);
        return;
      }

      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        8000,
        "getSession"
      );

      if (reqIdRef.current !== reqId) return;
      if (isLoggingOutRef.current) return;

      if (error || !data.session) {
        setLoggedOut(error?.message ?? null);
        return;
      }

      await hydrateFromSession(data.session);
    } catch (e: any) {
      if (reqIdRef.current !== reqId) return;
      setLoggedOut(e?.message || "Failed to refresh auth session.");
    } finally {
      end("refreshAuth");
    }
  }, [begin, end, hydrateFromSession, setLoggedOut]);

  // ✅ LOGOUT: instant UI (no loading spinner / no delay)
  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;

    // Immediately update UI to logged-out state
    setLoggedOut(null);

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) console.error("[Auth] signOut(global) error:", error);

      clearSupabaseAuthStorage();
      clearAdminKey();

      // Extra safety: ensure no session remains
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.warn(
          "[Auth] Session still present after logout; forcing local signOut + storage clear."
        );
        await supabase.auth.signOut({ scope: "local" });
        clearSupabaseAuthStorage();
        clearAdminKey();
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [setLoggedOut]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const reqId = ++reqIdRef.current;
        begin("onAuthStateChange");
        console.log("[Auth] event:", event);

        try {
          if (isLoggingOutRef.current) {
            if (!session) setLoggedOut(null);
            return;
          }

          if (!session) {
            setLoggedOut(null);
            return;
          }

          await hydrateFromSession(session);
        } catch (e: any) {
          if (reqIdRef.current !== reqId) return;
          setLoggedOut(e?.message || "Auth state change failed.");
        } finally {
          end("onAuthStateChange");
        }
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [begin, end, hydrateFromSession, setLoggedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      roleError,
      loading,
      refreshAuth,
      logout,
    }),
    [user, role, roleError, loading, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
