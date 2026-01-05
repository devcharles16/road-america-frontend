import { Navigate, useLocation } from "react-router-dom";
import React from "react";

const AUTH_PUBLIC_DISABLED =
  import.meta.env.VITE_AUTH_PUBLIC_ENABLED === "false";


type Props = {
  children: React.ReactNode;
};

export default function AuthPublicGate({ children }: Props) {
  const location = useLocation();

  // Always allow login routes so staff can sign in
  const allowList = ["/login", "/admin/login"];
  const isAllowed = allowList.includes(location.pathname);

  if (AUTH_PUBLIC_DISABLED && !isAllowed) {
    return <Navigate to="/" replace />;
  }
  

  return <>{children}</>;
}
