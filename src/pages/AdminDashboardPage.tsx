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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listShipments } from "../services/shipmentsService";
import { adminListQuotes } from "../services/adminQuotesService";

// ... other imports

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    activeShipments: 0,
    quotesToday: 0,
    pendingQuotes: 0,
    publishedArticles: 12, // Mock for now
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [shipments, quotes] = await Promise.all([
          listShipments(),
          adminListQuotes(),
        ]);

        // Active Shipments: Submitted, Driver Assigned, In Transit
        const activeShipmentsCount = shipments.filter((s) =>
          ["Submitted", "Driver Assigned", "In Transit"].includes(s.status || "")
        ).length;

        // Quotes Today
        const now = new Date();
        const todayStr = now.toDateString();
        const quotesTodayCount = quotes.filter((q) => {
          if (!q.created_at) return false;
          return new Date(q.created_at).toDateString() === todayStr;
        }).length;

        // Pending Quotes (adminListQuotes filters out closed/converted often, but let's trust the list size for "Pending")
        // The user renaming "Pending Approvals" -> "Total Pending Quotes".
        // Assuming adminListQuotes returns the relevant pending queue.
        const pendingQuotesCount = quotes.length;

        setStats((prev) => ({
          ...prev,
          activeShipments: activeShipmentsCount,
          quotesToday: quotesTodayCount,
          pendingQuotes: pendingQuotesCount,
        }));
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Active Shipments",
      value: loading ? "..." : stats.activeShipments,
      href: "/admin/shipments",
    },
    {
      label: "Quotes Today",
      value: loading ? "..." : stats.quotesToday,
      href: "/admin/shipments?tab=quotes",
    },
    {
      label: "Total Pending Quotes",
      value: loading ? "..." : stats.pendingQuotes,
      href: "/admin/shipments?tab=quotes",
    },
    {
      label: "Published Articles",
      value: stats.publishedArticles,
      href: "/admin/blog", // intuitive guess, editable if wrong
    },
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
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="block rounded-2xl border border-white/10 bg-black/50 px-4 py-3 transition-colors hover:border-brand-redSoft/50 hover:bg-white/5"
          >
            <p className="text-[11px] uppercase tracking-wide text-white/50">
              {stat.label}
            </p>
            <p className="mt-2 text-xl font-semibold">{stat.value}</p>
          </Link>
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
