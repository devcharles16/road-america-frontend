import { Navigate } from "react-router-dom";
import React from "react";

const AUTH_PUBLIC_ENABLED =
  import.meta.env.VITE_AUTH_PUBLIC_ENABLED === "true";

type Props = {
  children: React.ReactNode;
};

export default function AuthPublicGate({ children }: Props) {
  if (!AUTH_PUBLIC_ENABLED) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
