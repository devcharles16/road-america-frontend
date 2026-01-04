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

  // IMPORTANT: upsert only truly dedupes if profiles.id has a UNIQUE/PK constraint
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

  // NOTE: We keep `loading` in sync using a counter so it can’t get stuck true
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(0);

  // Dev-only: StrictMode double mount protection
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

  // Prevent stale async overwrites for session refresh flows
  const reqIdRef = useRef(0);

  // Prevent “logout rehydrates session” races
  const isLoggingOutRef = useRef(false);

  // Track active user so role results can't apply to the wrong user
  const activeUserIdRef = useRef<string | null>(null);

  const setLoggedOut = useCallback((err: string | null = null) => {
    // If we're logged out, we should never be "loading" forever
    pendingRef.current = 0;
    setLoading(false);

    setUser(null);
    setRole(null);
    setRoleError(err);
    activeUserIdRef.current = null;
  }, []);

  const fetchRoleForUser = useCallback(async (u: any) => {
    if (!u?.id) {
      setRole(null);
      setRoleError("Missing user id.");
      return;
    }

    const userId = String(u.id);

    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
        8000,
        "profiles(role)"
      );

      // Only apply if this is still the active logged-in user
      if (isLoggingOutRef.current) return;
      if (activeUserIdRef.current !== userId) return;

      // Hard error (RLS, network, etc.)
      if (error) {
        setRole(null);
        setRoleError(error.message);
        return;
      }

      // No profile row → attempt to create default "client" profile
      if (!data) {
        try {
          await upsertProfileDefaultClient(u);
        } catch (e: any) {
          if (activeUserIdRef.current === userId) {
            setRole(null);
            setRoleError(e?.message || "Failed to create default profile.");
          }
          return;
        }

        // ✅ FIX: retry read MUST NOT use .single() (can throw on 0 rows)
        const { data: retryData, error: retryErr } = await withTimeout(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle(),
          8000,
          "profiles(role) retry"
        );

        if (isLoggingOutRef.current) return;
        if (activeUserIdRef.current !== userId) return;

        if (retryErr) {
          setRole(null);
          setRoleError(retryErr.message);
          return;
        }

        if (!retryData) {
          // Still missing (or RLS blocked) even after upsert attempt
          setRole(null);
          setRoleError("Profile row missing or access denied (RLS).");
          return;
        }

        setRoleError(null);
        setRole(normalizeRole(retryData.role));
        return;
      }

      // Profile exists
      setRoleError(null);
      setRole(normalizeRole(data.role));
    } catch (e: any) {
      if (isLoggingOutRef.current) return;
      if (activeUserIdRef.current !== userId) return;

      setRole(null);
      setRoleError(e?.message || "Failed to load role.");
    }
  }, []);

  const hydrateFromSession = useCallback(
    async (session: any) => {
      if (isLoggingOutRef.current) return;

      const u = session?.user ?? null;
      if (!u) {
        setLoggedOut(null);
        return;
      }

      setUser(u);
      activeUserIdRef.current = String(u.id);
      setRoleError(null);
      setRole(undefined); // role is now "loading" for a real user
      await fetchRoleForUser(u);
    },
    [fetchRoleForUser, setLoggedOut]
  );

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

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;

    // Immediately show logged out UI
    setLoggedOut(null);
    begin("logout");

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) console.error("[Auth] signOut(global) error:", error);

      clearSupabaseAuthStorage();
      clearAdminKey();

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
      end("logout");
    }
  }, [begin, end, setLoggedOut]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    refreshAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const reqId = ++reqIdRef.current;
        begin("onAuthStateChange");

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
  }, [begin, end, hydrateFromSession, refreshAuth, setLoggedOut]);

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
