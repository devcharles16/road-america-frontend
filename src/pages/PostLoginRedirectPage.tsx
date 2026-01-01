import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PostLoginRedirectPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until AuthContext finishes session + role hydration
    if (loading) return;

    // If no session, go to client login (or choose one)
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
console.log("POST LOGIN REDIRECT", {
  user,
  role,
  loading,
});

    // Route based on role
    if (role === "admin" || role === "employee") {
      navigate("/admin", { replace: true });
      return;
    }

    if (role === "client") {
      navigate("/my-shipments", { replace: true });
      return;
    }

    // Logged in but no role found in profiles
    navigate("/", { replace: true });
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-white/70">
      Redirecting…
    </div>
  );
}
