import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";

console.log(
  "AuthContext sees client id:",
  (globalThis as any).__SUPABASE_CLIENT__?.id
);

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role;
  roleError: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Used to ignore stale async responses
  const requestIdRef = useRef(0);

  const fetchRole = useCallback(async (userId: string, requestId: number) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (requestIdRef.current !== requestId) return;

    if (error) {
      setRole(null);
      setRoleError(error.message);
      return;
    }

    setRoleError(null);
    setRole((data?.role as Role) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      // Strongest source of truth for "are we logged in right now?"
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (requestIdRef.current !== requestId) return;

      if (sessionErr || !sessionData.session) {
        // No session -> definitely logged out
        setUser(null);
        setRole(null);
        setRoleError(sessionErr?.message ?? null);
        return;
      }

      // Session exists -> hydrate user + role
      const u = sessionData.session.user ?? null;
      setUser(u);

      if (u?.id) {
        await fetchRole(u.id, requestId);
      } else {
        setRole(null);
        setRoleError(null);
      }
    } catch {
      if (requestIdRef.current !== requestId) return;
      setUser(null);
      setRole(null);
      setRoleError("Failed to refresh profile.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
    
  }, [fetchRole]);

  const logout = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    // ✅ UI updates immediately
    setUser(null);
    setRole(null);
    setRoleError(null);
    setLoading(false);

    // ✅ Clear persisted session on this device
    const { error } = await supabase.auth.signOut({ scope: "local" });

    // If something else tried to refresh during logout, ignore stale work
    if (requestIdRef.current !== requestId) return;

    if (error) {
      console.error("[Auth] signOut error:", error);
      // Keep state cleared (user is “logged out” from UI perspective)
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const requestId = ++requestIdRef.current;
        setLoading(true);

        try {
          const u = session?.user ?? null;

          if (requestIdRef.current !== requestId) return;

          setUser(u);

          if (u?.id) {
            await fetchRole(u.id, requestId);
          } else {
            setRole(null);
            setRoleError(null);
          }
        } catch {
          if (requestIdRef.current !== requestId) return;
          setUser(null);
          setRole(null);
          setRoleError("Auth state change failed.");
        } finally {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        }
      }
    );

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, role, roleError, loading, refreshProfile, logout }),
    [user, role, roleError, loading, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
