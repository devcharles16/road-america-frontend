// src/layouts/AdminLayout.tsx
import { NavLink, Outlet } from "react-router-dom";

const adminNavItems = [
  { label: "Dashboard", to: "/admin" },
  { label: "Shipments", to: "/admin/shipments" },
  { label: "Blog Articles", to: "/admin/blog" },
  { label: "Users", to: "/admin/users" },
  // you can add more later, e.g. { label: "Notifications", to: "/admin/notifications" }
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-black/70">
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
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
                    ? "bg-white/5 border-brand-redSoft text-white"
                    : "text-white/60 hover:text-white/90 hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-redSoft" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 text-[11px] text-white/50">
          <p>Signed in as Admin</p>
          {/* later: show real admin email/role */}
        </div>
      </aside>

      {/* Mobile top bar + content */}
      <div className="flex-1 flex flex-col">
        {/* Simple mobile header; you can make this fancier later */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 md:hidden">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              Admin
            </p>
            <p className="text-sm font-semibold"> Auto Transport</p>
          </div>
          {/* Could add a menu button later if you want a mobile drawer */}
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 bg-gradient-to-br from-black via-brand-dark to-brand-gray">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
