
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Role = "admin" | "employee" | "client" | null;

type AuthContextValue = {
  user: any | null;
  role: Role;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchRole(userId: string): Promise<Role> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch role from profiles:", error);
    return null;
  }
  console.log("fetchRole role:", data?.role);
  return (data?.role as Role) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

const refreshProfile = async () => {
  setLoading(true);
  try {
    const { data } = await supabase.auth.getUser();
    const u = data?.user ?? null;
    setUser(u);

    if (u?.id) {
      const r = await fetchRole(u.id);
      setRole(r);
    } else {
      setRole(null);
    }
  } catch (err) {
    console.error("refreshProfile failed:", err);
    setUser(null);
    setRole(null);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    // Initial load
    refreshProfile();

    // Keep role in sync on login/logout
const { data: sub } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    setLoading(true);
    try {
      const u = session?.user ?? null;
      setUser(u);

      if (u?.id) {
        const r = await fetchRole(u.id);
        setRole(r);
      } else {
        setRole(null);
      }

      console.log("Auth change event, user:", session?.user?.email);
    } catch (err) {
      console.error("onAuthStateChange failed:", err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }
);


    return () => {
      sub.subscription.unsubscribe();
    };
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
