import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // prevents stale async updates (StrictMode safe)
  const requestIdRef = useRef(0);

  async function fetchRole(userId: string, requestId: number): Promise<void> {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (requestIdRef.current !== requestId) return; // stale request

    if (error) {
      console.error("fetchRole failed:", error);
      setRole(null);
      return;
    }
console.log("fetchRole userId:", userId);

    setRole((data?.role as Role) ?? null);
    console.log("fetchRole data:", data, "error:", error);

  }

  const refreshProfile = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      const u = session?.user ?? null;

      if (requestIdRef.current !== requestId) return;

      setUser(u);

      if (u?.id) {
        await fetchRole(u.id, requestId);
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error("refreshProfile failed:", err);
      setUser(null);
      setRole(null);
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
        }
      } catch (err) {
        console.error("onAuthStateChange failed:", err);
        setUser(null);
        setRole(null);
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
    () => ({ user, role, loading, refreshProfile }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
