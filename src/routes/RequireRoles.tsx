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
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-white/60">Loading…</div>;
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
