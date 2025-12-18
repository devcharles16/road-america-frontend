import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLoginRedirectPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (role === "admin" || role === "employee") {
      navigate("/admin", { replace: true });
      return;
    }

    // default for clients (or role not set yet)
    navigate("/my-shipments", { replace: true });
  }, [loading, user, role, navigate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-white/70">
      Signing you in…
    </div>
  );
}
