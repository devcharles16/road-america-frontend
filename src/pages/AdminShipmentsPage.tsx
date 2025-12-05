// src/pages/AdminShipmentsPage.tsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

import {
  listShipments,
  updateShipmentStatus,
  type TransportRequest,
  type TransportStatus,
} from "../services/shipmentsService";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const STATUS_OPTIONS: TransportStatus[] = [
  "Submitted",
  "Driver Assigned",
  "In Transit",
  "Delivered",
  "Cancelled",
];

const AdminShipmentsPage = () => {
  const [shipments, setShipments] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function ensureSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate("/admin/login");
    }
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listShipments();
      setShipments(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Failed to load shipments. You may not have access to this area."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ensureSession().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusChange(id: string, status: TransportStatus) {
    try {
      setSavingId(id);
      setError(null);
      const updated = await updateShipmentStatus(id, status);
      
      async function handleStatusChange(id: string, status: TransportStatus) {
  try {
    setSavingId(id);
    setError(null);

    // 1️⃣ Update status in Supabase (existing behavior)
    const updated = await updateShipmentStatus(id, status);

    // Update UI
    setShipments((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );

    // 2️⃣ Fire Status Update Email Notification (NEW)
    // Build route + vehicle summary
    const pickup = `${updated.pickupCity}, ${updated.pickupState}`;
    const dropoff = `${updated.deliveryCity}, ${updated.deliveryState}`;
    const vehicle = `${updated.vehicleYear} ${updated.vehicleMake} ${updated.vehicleModel}`.trim();

    // Non-blocking email call
    fetch(`${API_BASE_URL}/api/notifications/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: updated.referenceId,
        status: updated.status,
        customerEmail: updated.customerEmail,
        customerName: updated.customerName,
        pickup,
        dropoff,
        vehicle,
      }),
    }).catch((err) =>
      console.error("Failed to send status update email:", err)
    );

  } catch (err) {
    console.error(err);
    setError("Something went wrong while updating status.");
  } finally {
    setSavingId(null);
  }
}

      setShipments((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating status.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
              Admin
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Shipments & Tracking
            </h1>
            <p className="mt-2 text-xs text-white/70">
              Manage transport requests, update statuses, and control what
              customers see on the public tracking page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
            >
              Users
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
            >
              Log Out
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-xs text-white/60">Loading shipments…</p>
        ) : shipments.length === 0 ? (
          <p className="text-xs text-white/60">
            No shipments found yet. Once quote requests are converted to
            transports, they will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-soft-card">
            <table className="min-w-full text-xs">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Ref ID</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Route
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Vehicle
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {s.referenceId}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>{s.customerName}</span>
                        <span className="text-[10px] text-white/50">
                          {s.customerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span>
                        {s.pickupCity}, {s.pickupState} → {s.deliveryCity},{" "}
                        {s.deliveryState}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span>
                        {s.vehicleYear} {s.vehicleMake} {s.vehicleModel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={s.status}
                        disabled={savingId === s.id}
                        onChange={(e) =>
                          handleStatusChange(
                            s.id,
                            e.target.value as TransportStatus
                          )
                        }
                        className="rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[11px] outline-none focus:border-brand-redSoft"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-white/60">
                      {new Date(s.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminShipmentsPage;
