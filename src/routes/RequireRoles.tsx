import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRoles({
  allowed,
  redirectTo = "/login",
}: {
  allowed: Array<"admin" | "employee" | "client">;
  redirectTo?: string;
}) {
  const { user, role, loading, roleError, refreshAuth } = useAuth();
  const location = useLocation();

  // Wait for auth + role hydration
  if (loading || role === undefined) {
    return (
      <div className="p-6 text-text-primary">
        <div className="text-lg font-semibold">Loading your account…</div>
        {roleError ? (
          <div className="text-red-400 text-sm mt-2">
            Error: {roleError}
          </div>
        ) : (
          <div className="text-text-primary text-sm mt-2">
            Please wait while we verify permissions.
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => {
              // Force a retry
              refreshAuth();
            }}
            className="px-3 py-1 bg-[#172B3D]/10 hover:bg-[#172B3D]/20 rounded text-xs text-text-primary transition-colors"
          >
            Retry
          </button>
        </div>

        <div className="text-xs text-text-supporting mt-8 font-mono">
          Debug: loading={String(loading)}, role={String(role)}
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
