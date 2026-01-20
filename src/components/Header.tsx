import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, role, profile, loading, logout } = useAuth();

  // Treat auth as "ready" only when hydration is done (prevents UI churn during races)
  const authReady = !loading;

  const isLoggedIn = authReady && !!user;
  const isClient = isLoggedIn && role === "client";
  const isAdminUser = isLoggedIn && (role === "admin" || role === "employee");

  const displayName =
    (profile?.full_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Account";

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setMobileOpen(false);
      // ✅ IMPORTANT: no navigate() here. Redirects are handled elsewhere.
    }
  };

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Get My Transport Quote", to: "/quote" },
    { label: "Track Shipment", to: "/track" },
    { label: "Blog", to: "/blog" },
    { label: "About", to: "/about" },
  ];

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
                `hover:text-white transition ${isActive ? "text-white" : "text-white/80"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Client-only */}
          {authReady && isClient && (
            <NavLink
              to="/shipments"
              className={({ isActive }) =>
                `hover:text-brand-red transition ${isActive ? "text-brand-red" : "text-white/80"
                }`
              }
            >
              My Shipments
            </NavLink>
          )}

          {/* Admin / Employee */}
          {authReady && isAdminUser && (
            <NavLink
              to="/admin/shipments"
              className={({ isActive }) =>
                `hover:text-brand-redSoft transition ${isActive ? "text-brand-redSoft" : "text-white/80"
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="h-8 w-8 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-redSoft border border-brand-red/30">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block">
                    {displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-full border border-white/25 px-3 py-2 text-white"
          onClick={() => setMobileOpen((o) => !o)}
          type="button"
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

            {authReady && isClient && (
              <Link
                to="/shipments"
                onClick={() => setMobileOpen(false)}
                className="block text-white/80"
              >
                My Shipments
              </Link>
            )}

            {authReady && isAdminUser && (
              <Link
                to="/admin/shipments"
                onClick={() => setMobileOpen(false)}
                className="block text-white/80"
              >
                Admin Dashboard
              </Link>
            )}

            {/* Auth UI (mobile) */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-white/80"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block text-white/80"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-1 text-white/80">
                    <div className="h-8 w-8 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-redSoft border border-brand-red/30">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{displayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors px-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
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
