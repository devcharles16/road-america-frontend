import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";
import type { ReactElement } from "react";

export function RequireRoles({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactElement;
}) {
  const { role, loading, user } = useAuth();

  if (loading) return <div className="p-6 text-white/60">Loading…</div>;

  // If user is logged in but role is missing, that's a profile/RLS problem.
  if (user && role === null) {
    return (
      <div className="p-6 text-white/70">
        Signed in, but no role found for this account. Please contact an administrator.
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
