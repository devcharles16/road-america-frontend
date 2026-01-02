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

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role;
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
    // your schema may not have updated_at; safe to remove if needed
    updated_at: new Date().toISOString(),
  };

  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

function clearSupabaseAuthStorage() {
  // Supabase stores tokens under keys like: "sb-<project-ref>-auth-token"
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
  const [role, setRole] = useState<Role>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent stale async overwrites
  const reqIdRef = useRef(0);

  // Prevent “logout rehydrates session” races
  const isLoggingOutRef = useRef(false);

  const setLoggedOut = useCallback((err: string | null = null) => {
    setUser(null);
    setRole(null);
    setRoleError(err);
  }, []);

  const fetchRoleForUser = useCallback(async (u: any, reqId: number) => {
    if (!u?.id) {
      if (reqIdRef.current === reqId) {
        setRole(null);
        setRoleError("Missing user id.");
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .single();

    if (reqIdRef.current !== reqId) return;
    if (isLoggingOutRef.current) return;

    if (!error) {
      setRoleError(null);
      setRole(normalizeRole(data?.role));
      return;
    }

    try {
      await upsertProfileDefaultClient(u);
    } catch (e: any) {
      if (reqIdRef.current === reqId) {
        setRole(null);
        setRoleError(error?.message || "Failed to load profile role.");
      }
      return;
    }

    const { data: retryData, error: retryErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .single();

    if (reqIdRef.current !== reqId) return;
    if (isLoggingOutRef.current) return;

    if (retryErr) {
      setRole(null);
      setRoleError(retryErr.message);
      return;
    }

    setRoleError(null);
    setRole(normalizeRole(retryData?.role));
  }, []);

  const hydrateFromSession = useCallback(
    async (session: any, reqId: number) => {
      if (isLoggingOutRef.current) return;

      const u = session?.user ?? null;
      if (!u) {
        setLoggedOut(null);
        return;
      }

      setUser(u);
      await fetchRoleForUser(u, reqId);
    },
    [fetchRoleForUser, setLoggedOut]
  );

  const refreshAuth = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);

    try {
      if (isLoggingOutRef.current) {
        setLoggedOut(null);
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (reqIdRef.current !== reqId) return;
      if (isLoggingOutRef.current) return;

      if (error || !data.session) {
        setLoggedOut(error?.message ?? null);
        return;
      }

      await hydrateFromSession(data.session, reqId);
    } catch (e: any) {
      if (reqIdRef.current !== reqId) return;
      setLoggedOut("Failed to refresh auth session.");
    } finally {
      if (reqIdRef.current === reqId) setLoading(false);
    }
  }, [hydrateFromSession, setLoggedOut]);

  const logout = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    isLoggingOutRef.current = true;

    // Immediately show logged out UI (prevents “stuck logged in” feel)
    setLoggedOut(null);
    setLoading(true);

    try {
      // Best effort server-side invalidation
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) console.error("[Auth] signOut(global) error:", error);

      // Always hard clear local persisted tokens
      clearSupabaseAuthStorage();

      // Verify: if session still exists, force local signout + clear again
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.warn("[Auth] Session still present after logout; forcing local signOut + storage clear.");
        await supabase.auth.signOut({ scope: "local" });
        clearSupabaseAuthStorage();
      }
    } finally {
      if (reqIdRef.current === reqId) {
        setLoading(false);
      }
      // Allow auth listener to run again after we’ve finished
      isLoggingOutRef.current = false;
    }
  }, [setLoggedOut]);

  useEffect(() => {
    refreshAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const reqId = ++reqIdRef.current;
        setLoading(true);

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

          await hydrateFromSession(session, reqId);
        } catch (e: any) {
          if (reqIdRef.current !== reqId) return;
          setLoggedOut("Auth state change failed.");
        } finally {
          if (reqIdRef.current === reqId) setLoading(false);
        }
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [hydrateFromSession, refreshAuth, setLoggedOut]);

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
