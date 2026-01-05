import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRoles({
  allowed,
  redirectTo = "/login",
}: {
  allowed: Array<"admin" | "employee" | "client">;
  redirectTo?: string;
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Wait for auth + role hydration
  if (loading || role === undefined) {
    return (
      <div className="p-6 text-white">
        <div className="text-lg font-semibold">Loading your account…</div>
        <div className="text-white/70 text-sm mt-2">
          Please wait while we verify permissions.
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Signed in but role missing/unknown
  if (!role) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Signed in but not allowed
  if (!allowed.includes(role)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
