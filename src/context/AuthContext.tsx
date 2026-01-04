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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role | undefined>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // NOTE: We keep `loading` in sync using a counter so it can’t get stuck true
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(0);

  const begin = useCallback(() => {
    pendingRef.current += 1;
    setLoading(true);
  }, []);

  const end = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    setLoading(pendingRef.current > 0);
  }, []);

  // Prevent stale async overwrites (still useful for session refresh flows)
  const reqIdRef = useRef(0);

  // Prevent “logout rehydrates session” races
  const isLoggingOutRef = useRef(false);

  // ✅ NEW: track which user is currently "active" so role results can't be discarded by reqId churn
  const activeUserIdRef = useRef<string | null>(null);

  const setLoggedOut = useCallback((err: string | null = null) => {
    setUser(null);
    setRole(null); // logged-out should NOT be undefined
    setRoleError(err);
    activeUserIdRef.current = null;
  }, []);

  // ✅ UPDATED: no reqId parameter; guard by active user id instead
  const fetchRoleForUser = useCallback(async (u: any) => {
    if (!u?.id) {
      setRole(null);
      setRoleError("Missing user id.");
      return;
    }

    const userId = String(u.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    // Only apply if this is still the active logged-in user
    if (isLoggingOutRef.current) return;
    if (activeUserIdRef.current !== userId) return;

    // Hard error (RLS, network, etc.) → do NOT upsert client
    if (error) {
      setRole(null);
      setRoleError(error.message);
      return;
    }

    // No profile row → safe to create default client profile
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

      // Re-read after creating
      const { data: retryData, error: retryErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (isLoggingOutRef.current) return;
      if (activeUserIdRef.current !== userId) return;

      if (retryErr) {
        setRole(null);
        setRoleError(retryErr.message);
        return;
      }

      setRoleError(null);
      setRole(normalizeRole(retryData?.role));
      return;
    }

    // Profile exists
    setRoleError(null);
    setRole(normalizeRole(data.role));
  }, []);

  // ✅ UPDATED: no reqId parameter; sets activeUserIdRef to prevent role=undefined forever
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
      setRole(undefined); // role is now "loading" for a real user
      await fetchRoleForUser(u);
    },
    [fetchRoleForUser, setLoggedOut]
  );

  const refreshAuth = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    begin();

    try {
      if (isLoggingOutRef.current) {
        setLoggedOut(null);
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      // Keep these guards for session refresh churn (fine)
      if (reqIdRef.current !== reqId) return;
      if (isLoggingOutRef.current) return;

      if (error || !data.session) {
        setLoggedOut(error?.message ?? null);
        return;
      }

      await hydrateFromSession(data.session);
    } catch (e: any) {
      if (reqIdRef.current !== reqId) return;
      setLoggedOut("Failed to refresh auth session.");
    } finally {
      end();
    }
  }, [begin, end, hydrateFromSession, setLoggedOut]);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;

    // Immediately show logged out UI
    setLoggedOut(null);
    begin();

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
      end();
    }
  }, [begin, end, setLoggedOut]);

  useEffect(() => {
    refreshAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const reqId = ++reqIdRef.current;
        begin();

        try {
          // During logout, ignore any “phantom” sessions
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
          setLoggedOut("Auth state change failed.");
        } finally {
          end();
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
