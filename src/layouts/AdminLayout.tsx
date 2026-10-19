// src/layouts/AdminLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import Header from "../components/Header";

const adminNavItems = [
  { label: "Dashboard", to: "/admin" },
  { label: "Shipments", to: "/admin/shipments" },
  { label: "Blog Articles", to: "/admin/blog" },
  { label: "Banner", to: "/admin/banner" },
  { label: "Users", to: "/admin/users" },
  // you can add more later, e.g. { label: "Notifications", to: "/admin/notifications" }
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-brand-dark text-text-primary flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#172B3D]/10 bg-background-warm">
        <div className="px-6 py-5 border-b border-[#172B3D]/10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-supporting">
            Road America Auto Transport
          </p>
          <p className="mt-1 text-sm font-semibold">Admin Console</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-xl px-3 py-2 transition",
                  "border border-transparent",
                  isActive
                    ? "bg-[#172B3D]/5 border-brand-redSoft text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-[#172B3D]/5",
                ].join(" ")
              }
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-redSoft" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-[#172B3D]/10 text-[11px] text-text-muted">
          <p>Signed in as Admin</p>
          {/* later: show real admin email/role */}
        </div>
      </aside>

      {/* Mobile top bar + content */}
      <div className="flex-1 flex flex-col">
        {/* Simple mobile header; you can make this fancier later */}
        <Header />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
