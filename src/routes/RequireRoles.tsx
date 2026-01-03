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
  const { role, loading, user } = useAuth();
  const location = useLocation();

 if (loading || role === undefined) {
  return <div className="p-6 text-white/60">Loading…</div>;
}


  // Not logged in
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }}
      />
    );
  }

  // Logged in but role missing (RLS / profile issue)
 // Role still resolving
if (role === undefined) {
  return (
    <div className="p-6 text-white/60">
      Loading your account…
    </div>
  );
}

// Logged in but role missing (RLS / profile issue)
if (role === null) {
  return (
    <div className="p-6 text-white/70">
      Signed in, but no role found for this account. Please contact an administrator.
    </div>
  );
}


  // Logged in but wrong role
  if (!allowed.includes(role)) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  // Authorized
  return <Outlet />;
}
