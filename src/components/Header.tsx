// src/components/Header.tsx
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";


const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
const { user, role, loading } = useAuth();

const isLoggedIn = !!user;

const displayName =
  (user?.user_metadata?.full_name as string | undefined) ||
  user?.email ||
  "Account";

const handleLogout = async () => {
  await supabase.auth.signOut();
  setMobileOpen(false);
  navigate("/");
};

  const navItems = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Get a Quote", to: "/quote" },
    { label: "Track Shipment", to: "/track" },
    { label: "Blog", to: "/blog" },
  ];

  return (
    <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">

        {/* Logo Block */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png" // Make sure your file is in public/logo.png
            alt="Road America Auto Transport"
            className="h-10 w-auto object-contain"
          />
          <span className="text-sm md:text-xl font-bold tracking-wide text-white whitespace-nowrap">
            Road America Auto Transport
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs md:text-sm font-medium text-white/80">
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

        {!loading && !isLoggedIn && (
  <>
    <NavLink
      to="/login"
      className={({ isActive }) =>
        `hover:text-brand-red transition ${
          isActive ? "text-brand-red" : "text-white/80"
        }`
      }
    >
      Login
    </NavLink>

    <NavLink
      to="/register"
      className={({ isActive }) =>
        `hover:text-brand-red transition ${
          isActive ? "text-brand-red" : "text-white/80"
        }`
      }
    >
      Register
    </NavLink>
  </>
)}

{!loading && isLoggedIn && (
  <>
    <span className="text-xs text-white/50">
      Signed in as{" "}
      <span className="text-white/80 font-semibold">
        {displayName}
        {role ? ` · ${role}` : ""}
      </span>
    </span>

    <button
      onClick={handleLogout}
      className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold text-white hover:border-brand-redSoft"
    >
      Logout
    </button>
  </>
)}


          {/* Admin Link */}
         {!loading && isLoggedIn && (role === "admin" || role === "employee") && (
  <NavLink
    to="/admin"
    className="hover:text-brand-redSoft text-white/40 text-[11px] tracking-wide"
  >
    Admin
  </NavLink>
)}

        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-full border border-white/25 px-3 py-2 text-white text-sm"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4 text-sm text-white">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-white/80 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {!loading && !isLoggedIn && (
  <>
    <Link
      to="/login"
      onClick={() => setMobileOpen(false)}
      className="block py-1 text-white/80 hover:text-brand-red"
    >
      Login
    </Link>

    <Link
      to="/register"
      onClick={() => setMobileOpen(false)}
      className="block py-1 text-white/80 hover:text-brand-red"
    >
      Register
    </Link>
  </>
)}

{!loading && isLoggedIn && (
  <>
    <div className="text-[11px] text-white/50">
      Signed in as{" "}
      <span className="text-white/80 font-semibold">
        {displayName}
        {role ? ` · ${role}` : ""}
      </span>
    </div>

    <button
      onClick={handleLogout}
      className="text-left py-1 text-white/80 hover:text-brand-red"
    >
      Logout
    </button>
  </>
)}


              <Link
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block pt-2 text-[11px] text-white/50 hover:text-brand-redSoft"
              >
                Admin Login
              </Link>

              <Link
  to="/admin/blog"
  className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
>
  Blog
</Link>

            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
