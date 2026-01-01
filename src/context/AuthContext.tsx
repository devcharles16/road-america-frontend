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
  const r = String(input ?? "")
    .trim()
    .toLowerCase();

  if (r === "admin" || r === "employee" || r === "client") return r as Role;
  return null;
}

async function upsertProfileDefaultClient(u: any) {
  if (!u?.id) return;

  // Default for self-serve users. Staff should have role set manually in profiles.
  const payload = {
    id: u.id,
    email: u.email ?? null,
    role: "client",
    updated_at: new Date().toISOString(),
  };

  // If you don't have email/updated_at columns, remove them.
  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent stale async overwrites
  const reqIdRef = useRef(0);

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

    // 1) Try fetch
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .single();

    if (reqIdRef.current !== reqId) return;

    if (!error) {
      setRoleError(null);
      setRole(normalizeRole(data?.role));
      return;
    }

    // 2) If profile missing (or any error), try to create default profile once, then retry
    // (This is especially helpful if client users sign up but profiles row wasn't created.)
    try {
      await upsertProfileDefaultClient(u);
    } catch (e: any) {
      // If RLS blocks upsert, you'll see it here
      if (reqIdRef.current === reqId) {
        setRole(null);
        setRoleError(error.message || "Failed to load profile role.");
      }
      return;
    }

    const { data: retryData, error: retryErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .single();

    if (reqIdRef.current !== reqId) return;

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
      const u = session?.user ?? null;

      if (!u) {
        setLoggedOut(null);
        return;
      }

      setUser(u);

      // Always derive role from profiles
      await fetchRoleForUser(u, reqId);

      // Note: we do NOT force-redirect here; your /post-login handles that.
    },
    [fetchRoleForUser, setLoggedOut]
  );

  const refreshAuth = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (reqIdRef.current !== reqId) return;

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

    // Update UI immediately
    setLoggedOut(null);
    setLoading(false);

    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (reqIdRef.current !== reqId) return;

    if (error) {
      console.error("[Auth] signOut error:", error);
    }
  }, [setLoggedOut]);

  useEffect(() => {
    // Initial hydrate
    refreshAuth();

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const reqId = ++reqIdRef.current;
        setLoading(true);

        try {
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
