import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLoginRedirectPage() {
  const { user, role, loading, roleError, logout } = useAuth();
  const navigate = useNavigate();
  const [waitedMs, setWaitedMs] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWaitedMs((ms) => ms + 250), 250);
    return () => clearInterval(t);
  }, []);

  const isAdmin = useMemo(() => role === "admin" || role === "employee", [role]);

  useEffect(() => {
    // Wait for auth hydration
    if (loading) return;

    // If we don't have a user yet, DO NOT redirect to /login automatically.
    // This prevents the "bounce back to login" loop during session hydration races.
    if (!user) return;

    // Logged in but role still resolving
    if (role === undefined) return;

    if (isAdmin) {
      navigate("/admin/quotes", { replace: true });
      return;
    }

    // Default non-admin path
    navigate("/shipments", { replace: true });
  }, [loading, user, role, isAdmin, navigate]);

  const stuck = loading || (user && role === undefined) || (!user && waitedMs < 15000);
  const stuckTooLong = !user && waitedMs >= 15000;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/70 px-6">
      <div className="text-lg">{stuck ? "Redirecting…" : "Redirect complete."}</div>

      {stuckTooLong && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
          >
            Reload
          </button>

          <button
            onClick={() => navigate("/login", { replace: true })}
            className="rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
          >
            Back to Login
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
  );
}
