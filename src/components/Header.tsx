// src/components/Header.tsx
import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const { user, role, loading, logout } = useAuth();
  const isLoggedIn = !!user;

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Account";

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      await logout();
      setMobileOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Get My Transport Quote", to: "/quote" },
    { label: "Track Shipment", to: "/track" },
    { label: "Blog", to: "/blog" },
  ];

const isAdminUser = isLoggedIn && (role === "admin" || role === "employee");
const location = useLocation();

useEffect(() => {
  // Only redirect from auth-related pages
  const AUTH_PATHS = ["/login", "/register", "/admin/login", "/post-login"];

  if (!AUTH_PATHS.includes(location.pathname)) return;

  // Wait until auth fully resolves
  if (loading) return;

  if (!user) return;

  if (role === "admin" || role === "employee") {
    navigate("/admin", { replace: true });
    return;
  }

  if (role === "client") {
    navigate("/my-shipments", { replace: true });
    return;
  }
}, [user, role, loading, location.pathname, navigate]);



  return (
    <header className="bg-[#121212]/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Road America Auto Transport"
            className="h-10 w-auto object-contain"
          />
          <span className="text-sm md:text-xl font-bold tracking-wide text-white whitespace-nowrap">
            Road America Auto Transport
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `hover:text-white transition ${
                  isActive ? "text-white" : "text-white/80"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Client-only */}
          {isLoggedIn && role === "client" && (
            <NavLink
              to="/my-shipments"
              className={({ isActive }) =>
                `hover:text-brand-red transition ${
                  isActive ? "text-brand-red" : "text-white/80"
                }`
              }
            >
              My Shipments
            </NavLink>
          )}

          {/* Admin / Employee (HIDDEN during troubleshooting) */}
{isAdminUser && (
  <NavLink
    to="/admin"
    className={({ isActive }) =>
      `hover:text-brand-redSoft transition ${
        isActive ? "text-brand-redSoft" : "text-white/80"
      }`
    }
  >
    Admin Dashboard
  </NavLink>
)}


          {/* Auth UI */}
{!isLoggedIn ? (
  <>
    <NavLink to="/login">Login</NavLink>
    <NavLink to="/register">Register</NavLink>
  </>
) : (
  <>
    <span className="text-xs text-white/50">
      {displayName}
      {!loading && role ? ` · ${role}` : ""}
    </span>
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  </>
)}

        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-full border border-white/25 px-3 py-2 text-white"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10">
          <div className="px-4 py-4 space-y-3 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block text-white/80"
              >
                {item.label}
              </Link>
            ))}

            {isLoggedIn && role === "client" && (
              <Link
                to="/my-shipments"
                onClick={() => setMobileOpen(false)}
                className="block text-white/80"
              >
                My Shipments
              </Link>
            )}

           {isAdminUser && (
  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-white/80">
    Admin Dashboard
  </Link>
)}


{/* Auth UI (mobile) */}
<div className="pt-3 border-t border-white/10 space-y-2">
  {!isLoggedIn ? (
    <>
      <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-white/80">
        Login
      </Link>
      <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-white/80">
        Register
      </Link>
      <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="block text-white/80">
        Admin / Employee Login
      </Link>
    </>
  ) : (
    <>
      <span className="block text-xs text-white/50">
        {displayName}
        {!loading && role ? ` · ${role}` : ""}
      </span>
      <button type="button" onClick={handleLogout} className="block text-white/80">
        Logout
      </button>
    </>
  )}
</div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
