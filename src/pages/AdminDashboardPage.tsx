import LiveShipmentsCard from "../components/admin/LiveShipmentsCard";

// src/pages/AdminDashboardPage.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

export default function AdminDashboardPage() {
  // Later these will come from your backend
  const mockStats = [
    { label: "Active Shipments", value: "24" },
    { label: "Quotes Today", value: "18" },
    { label: "Pending Approvals", value: "3" },
    { label: "Published Articles", value: "12" },
  ];

  const shipmentsByStatus = [
    { status: "Submitted", count: 8 },
    { status: "Driver Assigned", count: 6 },
    { status: "In Transit", count: 7 },
    { status: "Delivered", count: 20 },
    { status: "Cancelled", count: 2 },
  ];

  const quotesPerDay = [
    { day: "Mon", count: 12 },
    { day: "Tue", count: 9 },
    { day: "Wed", count: 15 },
    { day: "Thu", count: 11 },
    { day: "Fri", count: 17 },
    { day: "Sat", count: 6 },
    { day: "Sun", count: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-xl">
            High-level view of Road America Auto Transport operations. Monitor shipments,
            quotes, and content at a glance.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-4">
        {mockStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-white/50">
              {stat.label}
            </p>
            <p className="mt-2 text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Charts row */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Shipments by status (bar chart) */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Shipments by Status</h2>
            <span className="text-[11px] text-white/40">
              Mock data · visual only
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shipmentsByStatus} margin={{ left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050509",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    fontSize: "11px",
                    color: "white",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  // we don't specify colors here; Recharts will use defaults
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quotes per day (area chart) */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Quotes This Week</h2>
            <span className="text-[11px] text-white/40">
              Mock data · visual only
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quotesPerDay} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="quotesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.8} />
                    <stop offset="95%" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050509",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    fontSize: "11px",
                    color: "white",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#quotesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Lower row: quick actions & notes */}
      {/* Live Shipments + Quick Actions */}
<section className="mt-4 grid gap-4 lg:grid-cols-2">
  {/* Left: Live Shipments */}
  <LiveShipmentsCard />

  {/* Right: Quick Actions */}
  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
    <h2 className="text-sm font-semibold">Quick Actions</h2>
    <ul className="mt-3 space-y-2 text-sm text-white/70">
      <li>• Review new transport quote requests</li>
      <li>• Update shipment statuses for in-transit vehicles</li>
      <li>• Publish a new blog article for SEO and trust</li>
      <li>• Add or update client & employee user accounts</li>
    </ul>
  </div>
</section>

    </div>
  );
}
