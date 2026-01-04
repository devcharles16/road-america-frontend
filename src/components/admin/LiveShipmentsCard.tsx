// src/components/admin/LiveShipmentsCard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  FileText,
  UserCheck,
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

type ShipmentStatus =
  | "Submitted"
  | "Driver Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled"
  | string;

type Shipment = {
  id: string;
  referenceId?: string | null;

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
  if (status === "In Transit") return "bg-brand-red/20 text-brand-redSoft";
  if (status === "Driver Assigned") return "bg-emerald-500/15 text-emerald-300";
  if (status === "Submitted") return "bg-amber-500/15 text-amber-300";
  if (status === "Delivered") return "bg-sky-500/15 text-sky-300";
  if (status === "Cancelled") return "bg-rose-500/15 text-rose-300";
  return "bg-white/10 text-white/80";
}

function getStatusIcon(status: ShipmentStatus) {
  switch (status) {
    case "Submitted":
      return FileText;
    case "Driver Assigned":
      return UserCheck;
    case "In Transit":
      return Truck;
    case "Delivered":
      return CheckCircle2;
    case "Cancelled":
      return XCircle;
    default:
      return HelpCircle;
  }
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

        const { data, error } = await supabase
        .from("shipments")
        .select(
          `
            id,
            referenceId:reference_id,
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
      

        if (error) throw error;
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
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Live Shipments</h2>
        <p className="mt-1 text-[11px] text-white/50">
          Last 5 active shipments (Submitted, Driver Assigned, In Transit)
        </p>
      </div>

      {!loading && !error && shipments.length === 0 && (
        <p className="text-xs text-white/60">
          No active shipments found yet.
        </p>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="space-y-3">
          {shipments.map((shipment) => {
            const pickupCity = shipment.pickup_city || "Pickup pending";
            const pickupState = shipment.pickup_state || "";
            const deliveryCity = shipment.delivery_city || "Delivery pending";
            const deliveryState = shipment.delivery_state || "";

            const vehicle =
              shipment.vehicle_make || shipment.vehicle_model
                ? `${shipment.vehicle_year || ""} ${shipment.vehicle_make || ""} ${
                    shipment.vehicle_model || ""
                  }`.trim()
                : "Vehicle details pending";

            const status = shipment.status || "Unknown";
            const badgeClasses = getStatusBadgeClasses(status);
            const StatusIcon = getStatusIcon(status);

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

                    {/* ICON BADGE – no absolute positioning, no overlap */}
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${badgeClasses}`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        <StatusIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="leading-none">{status}</span>
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

                  {shipment.referenceId && (
                    <p className="text-[11px] text-white/50">
                      Ref:{" "}
                      <span className="font-mono">
                        {shipment.referenceId}
                      </span>
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
