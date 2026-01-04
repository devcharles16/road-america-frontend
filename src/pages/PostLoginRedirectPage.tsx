import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLoginRedirectPage() {
  const { user, role, loading, roleError, refreshAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [waitedMs, setWaitedMs] = useState(0);

  // Timer so we can detect "stuck" loading
  useEffect(() => {
    const t = setInterval(() => setWaitedMs((ms) => ms + 250), 250);
    return () => clearInterval(t);
  }, []);

  // ✅ If we're not logged in, don't keep waiting forever.
  // Give auth hydration a moment, then send to login.
  useEffect(() => {
    if (!user && waitedMs >= 1500) {
      navigate("/login", { replace: true });
    }
  }, [user, waitedMs, navigate]);

  // ✅ Only force refresh if we have a user but role isn't resolved yet.
  // (This should NOT run when user is null.)
  useEffect(() => {
    if (user && role === undefined && waitedMs >= 500) {
      refreshAuth().catch(() => {});
    }
  }, [user, role, waitedMs, refreshAuth]);

  const isAdmin = useMemo(
    () => role === "admin" || role === "employee",
    [role]
  );

  useEffect(() => {
    // Wait for role hydration if logged in
    if (user && role === undefined) return;

    // Route by role once known
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    if (user && role === "client") {
      navigate("/my-shipments", { replace: true });
      return;
    }

    // Logged in but role missing / unknown -> safe fallback
    if (!loading && user && role === null) {
      navigate("/", { replace: true });
    }
  }, [user, role, loading, isAdmin, navigate]);

  const stuckRole = user && role === undefined && waitedMs >= 6000;

  return (
    <>
      {/* Impossible-to-miss overlay */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 999999,
          background: "yellow",
          color: "black",
          padding: "8px 10px",
          border: "2px solid black",
          fontSize: 12,
        }}
      >
        PostLoginRedirectPage MOUNTED ✅
      </div>

      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/70 px-6">
        <div className="text-lg">
          {stuckRole ? "Still loading your account…" : "Redirecting…"}
        </div>

        {stuckRole && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => refreshAuth().catch(() => {})}
              className="rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
            >
              Retry
            </button>

            <button
              onClick={() => logout().catch(() => {})}
              className="rounded-full bg-brand-red px-5 py-2 text-sm text-white hover:bg-brand-redSoft"
            >
              Log out
            </button>
          </div>
        )}

        {/* TEMP DEBUG — remove later */}
        <div className="mt-4 w-full max-w-xl rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          <div>
            <b>loading:</b> {String(loading)}
          </div>
          <div>
            <b>waited:</b> {waitedMs}ms
          </div>
          <div>
            <b>user:</b> {user ? "yes" : "no"}
          </div>
          <div>
            <b>role:</b> {role === undefined ? "undefined" : role ?? "null"}
          </div>
          <div>
            <b>roleError:</b> {roleError ?? "none"}
          </div>
        </div>
      </div>
    </>
  );
}
