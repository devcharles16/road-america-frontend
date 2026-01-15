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

export type Profile = {
  full_name?: string | null;
  role?: Role;
};

type AuthContextValue = {
  user: any | null;
  role: Role | undefined; // undefined = loading role for logged-in user
  profile: Profile | null;
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

  const payload = {
    id: u.id,
    email: u.email ?? null,
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
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Loading is driven by a counter so it can’t get stuck true
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(0);

  const begin = useCallback((_label: string) => {
    pendingRef.current += 1;
    // console.log("[Auth begin]", _label, "pending =", pendingRef.current);
    setLoading(true);
  }, []);

  const end = useCallback((_label: string) => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    // console.log("[Auth end]", _label, "pending =", pendingRef.current);
    setLoading(pendingRef.current > 0);
  }, []);

  const reqIdRef = useRef(0);
  const isLoggingOutRef = useRef(false);

  // Track which user we've fully hydrated + fetched role for
  const activeUserIdRef = useRef<string | null>(null);
  const roleFetchedForUserIdRef = useRef<string | null>(null);
  const roleFetchInProgressRef = useRef(false);

  // Prevent duplicate subscriptions in dev edge cases
  const didSubscribeRef = useRef(false);

  // Avoid re-processing the same session over and over
  const lastSeenUserIdRef = useRef<string | null>(null);

  const setLoggedOut = useCallback((err: string | null = null) => {
    pendingRef.current = 0;
    setLoading(false);

    setUser(null);
    setRole(null);
    setProfile(null);
    setRoleError(err);

    activeUserIdRef.current = null;
    roleFetchedForUserIdRef.current = null;
    roleFetchInProgressRef.current = false;
    lastSeenUserIdRef.current = null;
  }, []);

  const fetchRoleForUser = useCallback(
    async (u: any) => {
      if (!u?.id) {
        setRole(null);
        setRoleError("Missing user id.");
        return;
      }

      const userId = String(u.id);

      // Already fetched role for this user (and user didn't change)
      if (roleFetchedForUserIdRef.current === userId) return;

      // If a role fetch is already running for this same user, don't start another
      if (
        roleFetchInProgressRef.current &&
        activeUserIdRef.current === userId
      ) {
        return;
      }

      roleFetchInProgressRef.current = true;
      activeUserIdRef.current = userId;

      // Mark role as loading (only if we don't already have a concrete role)
      setRole((prev) => (prev === undefined ? prev : undefined));
      setRoleError(null);

      try {
        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", userId)
            .maybeSingle(),
          15000,
          "profiles(role, full_name)"
        );

        if (isLoggingOutRef.current) return;
        if (activeUserIdRef.current !== userId) return;

        if (error) {
          setRoleError(error.message);
          // keep role loading so guards don't misroute; allow retry later
          setRole(undefined);
          setProfile(null);
          return;
        }

        if (!data) {
          // No profile row: create one, then retry once
          try {
            await upsertProfileDefaultClient(u);
          } catch (e: any) {
            setRoleError(e?.message || "Failed to create default profile.");
            setRole(undefined);
            setProfile(null);
            return;
          }

          const { data: retryData, error: retryErr } = await withTimeout(
            supabase
              .from("profiles")
              .select("role, full_name")
              .eq("id", userId)
              .maybeSingle(),
            15000,
            "profiles(role, full_name) retry"
          );

          if (isLoggingOutRef.current) return;
          if (activeUserIdRef.current !== userId) return;

          if (retryErr) {
            setRoleError(retryErr.message);
            setRole(undefined);
            setProfile(null);
            return;
          }

          // Safe fallback: default to client
          if (!retryData) {
            setRoleError(null);
            setRole("client");
            setProfile(null);
            roleFetchedForUserIdRef.current = userId;
            return;
          }

          setRoleError(null);
          setRole(normalizeRole(retryData.role));
          setProfile({
            full_name: retryData.full_name,
            role: normalizeRole(retryData.role),
          });
          roleFetchedForUserIdRef.current = userId;
          return;
        }

        setRoleError(null);
        setRole(normalizeRole(data.role));
        setProfile({
          full_name: data.full_name,
          role: normalizeRole(data.role),
        });
        roleFetchedForUserIdRef.current = userId;
      } catch (e: any) {
        setRoleError(e?.message || "Failed to load role.");
        setRole(undefined);
        setProfile(null);
      } finally {
        roleFetchInProgressRef.current = false;
      }
    },
    []
  );

  const hydrate = useCallback(
    async (session: any) => {
      if (isLoggingOutRef.current) return;

      const u = session?.user ?? null;
      if (!u) {
        setLoggedOut(null);
        return;
      }

      const userId = String(u.id);

      // ✅ Ignore duplicate hydration for same user within the same “burst”
      // This is what stops the repeating SIGNED_IN spam from re-triggering role fetches.
      if (lastSeenUserIdRef.current === userId && user?.id === userId) {
        // If role hasn't been fetched yet, still fetch it
        if (roleFetchedForUserIdRef.current !== userId) {
          await fetchRoleForUser(u);
        }
        return;
      }

      lastSeenUserIdRef.current = userId;

      setUser(u);
      await fetchRoleForUser(u);
    },
    [fetchRoleForUser, setLoggedOut, user?.id]
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

      await hydrate(data.session);
    } catch (e: any) {
      if (reqIdRef.current !== reqId) return;
      setLoggedOut(e?.message || "Failed to refresh auth session.");
    } finally {
      end("refreshAuth");
    }
  }, [begin, end, hydrate, setLoggedOut]);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;

    // Instant UI
    setLoggedOut(null);

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) console.error("[Auth] signOut(global) error:", error);

      clearSupabaseAuthStorage();
      clearAdminKey();

      // Extra safety
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // console.warn(
        //   "[Auth] Session still present after logout; forcing local signOut + storage clear."
        // );
        await supabase.auth.signOut({ scope: "local" });
        clearSupabaseAuthStorage();
        clearAdminKey();
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [setLoggedOut]);

  // Subscribe once + hydrate initial session once
  useEffect(() => {
    if (didSubscribeRef.current) return;
    didSubscribeRef.current = true;

    let alive = true;

    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;

      const reqId = ++reqIdRef.current;
      begin("onAuthStateChange");
      // console.log("[Auth] event:", _event);

      try {
        if (isLoggingOutRef.current) {
          if (!session) setLoggedOut(null);
          return;
        }

        if (!session) {
          setLoggedOut(null);
          return;
        }

        await hydrate(session);
      } catch (e: any) {
        if (reqIdRef.current !== reqId) return;
        setLoggedOut(e?.message || "Auth state change failed.");
      } finally {
        end("onAuthStateChange");
      }
    });

    // Initial session hydration (with retry)
    (async () => {
      const reqId = ++reqIdRef.current;
      begin("initialSession");

      try {
        let data: { session: any } | null = null;
        let fetchError: any = null;

        // Try up to 3 times
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await withTimeout(
              supabase.auth.getSession(),
              12000, // Increased timeout to 12s
              `getSession(initial) attempt ${attempt}`
            );
            if (res.error) throw res.error;
            data = res.data;
            fetchError = null;
            break; // Success
          } catch (e) {
            fetchError = e;
            if (attempt < 3) {
              // Wait 1s before retry
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }

        if (!alive) return;
        if (reqIdRef.current !== reqId) return;
        if (isLoggingOutRef.current) return;

        // If we failed after retries
        if (fetchError || !data?.session) {
          // If we already have a user from onAuthStateChange, we might effectively be logged in.
          // However, if getSession failed repeatedly, something is wrong.
          // Only log out if we truly have no session data.
          if (!data?.session) {
            setLoggedOut(fetchError?.message ?? "Failed to retrieve session.");
            return;
          }
        }

        await hydrate(data.session);
      } catch (e: any) {
        // If we are already logged in via onAuthStateChange, this logging is less critical.
        // We use the Ref because 'user' state in this closure is stale (initial null).
        if (!activeUserIdRef.current) {
          console.error("[Auth] Initial session fetch failed completely:", e);
        } else {
          console.warn("[Auth] Initial session fetch failed, but user is already active:", e);
        }
      } finally {
        end("initialSession");
      }
    })();

    return () => {
      alive = false;
      sub.data.subscription.unsubscribe();
    };
  }, [begin, end, hydrate, setLoggedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      profile,
      roleError,
      loading,
      refreshAuth,
      logout,
    }),
    [user, role, profile, roleError, loading, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
