// src/pages/MyShipmentsPage.tsx
import { useEffect, useState } from "react";
import { listMyShipments, type TransportRequest } from "../services/shipmentsService";
import { Link } from "react-router-dom";

const MyShipmentsPage = () => {
  const [shipments, setShipments] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listMyShipments();
      setShipments(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load your shipments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
            Client Portal
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            My Shipments
          </h1>
          <p className="mt-2 text-xs text-white/70">
            View all shipments associated with your account or email, including
            current transports and past deliveries.
          </p>
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-400">{error}</p>
        )}

        {loading ? (
          <p className="text-xs text-white/60">Loading your shipments…</p>
       ) : shipments.length === 0 ? (
  <div className="text-center mt-6">
    <p className="text-xs text-white/60">
      No shipments found for your account yet. Once we’ve booked a
      transport for you, it will appear here.
    </p>

    <Link
      to="/quote"
      className="inline-block mt-4 rounded-full bg-brand-red px-5 py-2 text-xs font-semibold text-white hover:bg-brand-redSoft"
    >
      Get a Quote
    </Link>
  </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-soft-card">
            <table className="min-w-full text-xs">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">
                    Ref ID
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
                      <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wide">
                        {s.status}
                      </span>
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

export default MyShipmentsPage;
