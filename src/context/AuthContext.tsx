import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role;
  roleError: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestIdRef = useRef(0);

  async function fetchRole(userId: string, requestId: number): Promise<void> {
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
  }

  const refreshProfile = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
        setRole(null);
        setRoleError(error.message);
        return;
      }

      const u = data?.user ?? null;

      if (requestIdRef.current !== requestId) return;

      setUser(u);

      if (u?.id) {
        await fetchRole(u.id, requestId);
      } else {
        setRole(null);
        setRoleError(null);
      }
    } catch {
      setUser(null);
      setRole(null);
      setRoleError("Failed to refresh profile.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        setUser(null);
        setRole(null);
        setRoleError("Auth state change failed.");
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, role, roleError, loading, refreshProfile }),
    [user, role, roleError, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
