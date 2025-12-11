// src/components/admin/LiveShipmentsCard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";


type ShipmentStatus =
  | "Submitted"
  | "Driver Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled"
  | string;

type Shipment = {
  id: string;
  reference_id?: string;
  referenceId?: string;
  pickup_city?: string;
  pickup_state?: string;
  delivery_city?: string;
  delivery_state?: string;
  vehicle_year?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  status?: ShipmentStatus;
  updated_at?: string | null;
  created_at?: string;
};

function getStatusBadgeClasses(status: ShipmentStatus) {
  // You can tweak these later if you want more nuance
  if (status === "In Transit") {
    return "bg-brand-red/20 text-brand-redSoft";
  }
  if (status === "Driver Assigned") {
    return "bg-emerald-500/15 text-emerald-300";
  }
  if (status === "Submitted") {
    return "bg-amber-500/15 text-amber-300";
  }
  return "bg-white/10 text-white/80";
}

export default function LiveShipmentsCard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadShipments() {
      try {
        setLoading(true);
        setError(null);

        // Query Supabase directly for "active" shipments
        const { data, error } = await supabase
          .from("shipments")
          .select(
            `
            id,
            reference_id,
            pickup_city,
            pickup_state,
            delivery_city,
            delivery_state,
            vehicle_year,
            vehicle_make,
            vehicle_model,
            status,
            updated_at,
            created_at
          `
          )
          .in("status", ["Submitted", "Driver Assigned", "In Transit"])
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(5);

        if (error) {
          throw error;
        }

        if (!isMounted) return;
        setShipments(data || []);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to load live shipments");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShipments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Live Shipments</h2>
          <p className="mt-1 text-[11px] text-white/50">
            Last 5 active shipments (Submitted, Driver Assigned, In Transit)
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-white/5 p-3 space-y-2"
            >
              <div className="flex justify-between">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-3 w-16 rounded bg-white/10" />
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <p className="text-xs text-red-300">
          Unable to load shipments: {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && shipments.length === 0 && (
        <p className="text-xs text-white/60">
          No active shipments found yet. As new transports move into Submitted,
          Driver Assigned, or In Transit, they&apos;ll appear here.
        </p>
      )}

      {/* Data state */}
      {!loading && !error && shipments.length > 0 && (
        <div className="space-y-3">
          {shipments.map((shipment) => {
            const pickupCity =
              shipment.pickup_city || "Pickup location pending";
            const pickupState = shipment.pickup_state || "";
            const deliveryCity =
              shipment.delivery_city || "Delivery location pending";
            const deliveryState = shipment.delivery_state || "";
            const vehicle =
              shipment.vehicle_make || shipment.vehicle_model
                ? `${shipment.vehicle_year || ""} ${shipment.vehicle_make || ""} ${
                    shipment.vehicle_model || ""
                  }`.trim()
                : "Vehicle details pending";

            const status = shipment.status || "Unknown";
            const badgeClasses = getStatusBadgeClasses(status);

            const updated =
              shipment.updated_at || shipment.created_at || undefined;
            const updatedLabel = updated
              ? new Date(updated).toLocaleString()
              : "Recently added";

            return (
              <div
                key={shipment.id}
                className="rounded-xl bg-black/40 p-3 text-xs text-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-white/40">
                      Route
                    </p>
                    <p className="truncate font-semibold">
                      {pickupCity}
                      {pickupState ? `, ${pickupState}` : ""} → {deliveryCity}
                      {deliveryState ? `, ${deliveryState}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-white/40">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClasses}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase text-white/40">
                      Vehicle
                    </p>
                    <p className="truncate">{vehicle}</p>
                  </div>
                  {shipment.reference_id && (
                    <p className="text-[11px] text-white/50">
                      Ref: <span className="font-mono">{shipment.reference_id}</span>
                    </p>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-white/40">
                  Last update: {updatedLabel}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
