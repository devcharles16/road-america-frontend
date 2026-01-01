import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLoginRedirectPage() {
  const { user, role, loading, roleError, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [waitedMs, setWaitedMs] = useState(0);

  // Force an auth refresh when we land here
  useEffect(() => {
    refreshAuth().catch(() => {});
  }, [refreshAuth]);

  // Simple timer so we can detect "stuck" loading
  useEffect(() => {
    const t = setInterval(() => setWaitedMs((ms) => ms + 250), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // If loading resolves normally, route by role
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      if (role === "admin" || role === "employee") {
        navigate("/admin", { replace: true });
        return;
      }

      if (role === "client") {
        navigate("/my-shipments", { replace: true });
        return;
      }

      // Logged in but no role -> send home (or pick /my-shipments if you prefer)
      navigate("/", { replace: true });
      return;
    }

    // Fallback: if we’ve been loading too long but user exists, don’t trap them here
    if (loading && waitedMs >= 3000 && user) {
      // If role still unknown, default clients to /my-shipments (change if you want)
      navigate("/my-shipments", { replace: true });
    }
  }, [user, role, loading, waitedMs, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/70 px-6">
      <div className="text-lg">Redirecting…</div>

      {/* TEMP DEBUG — remove later */}
      <div className="mt-4 w-full max-w-xl rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
        <div><b>loading:</b> {String(loading)}</div>
        <div><b>waited:</b> {waitedMs}ms</div>
        <div><b>user:</b> {user ? "yes" : "no"}</div>
        <div><b>role:</b> {role ?? "null"}</div>
        <div><b>roleError:</b> {roleError ?? "none"}</div>
      </div>
    </div>
  );
}
