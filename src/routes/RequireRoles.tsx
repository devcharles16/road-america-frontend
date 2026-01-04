import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

export function RequireRoles({
  allowed,
  redirectTo = "/login",
  unauthorizedTo = "/",
}: {
  allowed: Role[];
  redirectTo?: string;
  unauthorizedTo?: string;
}) {
  const { role, roleError, loading, user } = useAuth();
  const location = useLocation();

  // 1) Still hydrating auth session
  if (loading || (user && role === undefined)) {
    return (
      <div className="p-6 text-white/60">
        <div>Loading your account…</div>
        {roleError && <div className="mt-2 text-xs text-white/40">{roleError}</div>}
      </div>
    );
  }
  

  // 2) Not logged in (do NOT require role to be present to redirect)
  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // 3) Logged in, but role still not resolved
  if (role === undefined) {
    return <div className="p-6 text-white/60">Loading your account…</div>;
  }

  // 4) Logged in but role missing
  if (role === null) {
    return (
      <div className="p-6 text-white/70">
        <p>Signed in, but no role found for this account.</p>
        {roleError && <p className="mt-2 text-white/50 text-sm">{roleError}</p>}
        <p className="mt-4">Please contact an administrator.</p>
      </div>
    );
  }

  // 5) Wrong role
  if (!allowed.includes(role)) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return <Outlet />;
}
