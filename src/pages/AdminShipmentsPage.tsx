// src/pages/AdminShipmentsPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

import {
  listShipments,
  updateShipmentStatus,
  type TransportRequest,
  type TransportStatus,
} from "../services/shipmentsService";
import {
  adminCloseQuoteNotConverted,
  adminConvertQuoteToShipment,
  adminListQuotes,
  adminMarkQuoteAsConverted,
  QUOTE_STATUS_CLOSED_NOT_CONVERTED,
} from "../services/adminQuotesService";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

type AdminTab = "shipments" | "quotes";

type QuoteRow = {
  id: string;
  referenceId?: string | null;

  first_name?: string | null;
  last_name?: string | null;

  customer_email?: string | null;
  customer_phone?: string | null;

  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;

  vehicle_year?: string | number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;

  quote_status?: string | null;
  created_at?: string | null;
};

const STATUS_OPTIONS: TransportStatus[] = [
  "Submitted",
  "Driver Assigned",
  "In Transit",
  "Delivered",
  "Cancelled",
];



const AdminShipmentsPage = () => {
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<AdminTab>((searchParams.get("tab") as AdminTab) || "shipments");

  // Shipments
  const [shipments, setShipments] = useState<TransportRequest[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);

  // Quotes
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  async function loadShipments() {
    try {
      setLoadingShipments(true);
      setShipmentsError(null);
      const data = await listShipments();
      setShipments(data);
    } catch (err: any) {
      console.error(err);
      setShipmentsError(
        err?.message ||
        "Failed to load shipments. You may not have access to this area."
      );
    } finally {
      setLoadingShipments(false);
    }
  }

  async function loadQuotes() {
    try {
      setLoadingQuotes(true);
      setQuotesError(null);
      const rows = await adminListQuotes();
      setQuotes(rows ?? []);
    } catch (err: any) {
      console.error(err);
      setQuotesError(err?.message || "Failed to load quotes.");
      setQuotes([]);
    } finally {
      setLoadingQuotes(false);
    }
  }

  useEffect(() => {
    loadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-load quotes when tab is opened
  useEffect(() => {
    if (tab === "quotes" && quotes.length === 0 && !loadingQuotes) {
      loadQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleStatusChange(id: string, status: TransportStatus) {
    try {
      setSavingId(id);
      setShipmentsError(null);

      // 1) Update status in backend
      const updated = await updateShipmentStatus(id, status);

      // 2) Update UI
      setShipments((prev) => prev.map((s) => (s.id === id ? updated : s)));

      // 3) Fire Status Update Email Notification (non-blocking)
      const pickup = `${updated.pickupCity}, ${updated.pickupState}`;
      const dropoff = `${updated.deliveryCity}, ${updated.deliveryState}`;
      const vehicle = `${updated.vehicleYear ?? ""} ${updated.vehicleMake ?? ""} ${updated.vehicleModel ?? ""
        }`.trim();

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
      setShipmentsError("Something went wrong while updating status.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleConvertQuote(quoteId: string) {
    try {
      setConvertingId(quoteId);
      setQuotesError(null);

      await adminConvertQuoteToShipment(quoteId);
      // Ensure status is updated in DB
      await adminMarkQuoteAsConverted(quoteId);

      // Refresh both tabs so it "feels" instant
      await Promise.all([loadQuotes(), loadShipments()]);
      setTab("shipments");
      alert("Quote converted successfully!");
    } catch (err: any) {
      console.error(err);
      setQuotesError(err?.message || "Failed to convert quote to shipment.");
    } finally {
      setConvertingId(null);
    }
  }

  async function handleMarkConverted(quoteId: string) {
    if (!confirm("This will hide the quote from this list as 'Converted'. It will NOT create a shipment. Continue?")) return;

    try {
      setConvertingId(quoteId);
      setQuotesError(null);
      await adminMarkQuoteAsConverted(quoteId);
      setQuotes((prev) => prev.filter((q) => (q.id ?? "") !== quoteId));
    } catch (err: any) {
      console.error(err);
      setQuotesError(err?.message || "Failed to mark as converted.");
    } finally {
      setConvertingId(null);
    }
  }

  async function handleCloseQuoteNotConverted(quoteId: string) {
    try {
      setClosingId(quoteId);
      setQuotesError(null);

      await adminCloseQuoteNotConverted(quoteId);

      // Instant UI: remove from local list.
      setQuotes((prev) => prev.filter((q) => (q.id ?? "") !== quoteId));
    } catch (err: any) {
      console.error(err);
      setQuotesError(err?.message || "Failed to close quote.");
    } finally {
      setClosingId(null);
    }
  }

  async function handleLogout() {
    await logout();
  }

  const tabBtn = (key: AdminTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={[
        "rounded-full px-4 py-2 text-[11px] font-semibold",
        tab === key
          ? "bg-white/15 text-white"
          : "border border-white/30 text-white hover:border-brand-redSoft",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {tabBtn("shipments", "Shipments")}
            {tabBtn("quotes", "Quotes")}

            <button
              onClick={handleLogout}
              className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        {tab === "shipments" ? (
          <>
            {shipmentsError && (
              <p className="mb-3 text-xs text-red-400">{shipmentsError}</p>
            )}

            {loadingShipments ? (
              <LoadingState message="Loading shipments..." />
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
                      <th className="px-3 py-2 text-left font-semibold">
                        Ref ID
                      </th>
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
                            value={(s.status ?? "") as string}
                            disabled={savingId === s.id}
                            onChange={(e) => {
                              const next = e.target.value as TransportStatus;
                              handleStatusChange(s.id, next);
                            }}
                            className="rounded-full border border-white/20 bg-[#121212]/60 px-2 py-1 text-[11px] outline-none focus:border-brand-redSoft"
                          >
                            {/* Allows value="" when status is null/undefined */}
                            <option value="" disabled>
                              Select status…
                            </option>

                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-2 text-[10px] text-white/60">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "—"}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {quotesError && (
              <p className="mb-3 text-xs text-red-400">{quotesError}</p>
            )}

            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-white/70">
                Convert quotes into shipments using the same reference ID.
              </p>
              <button
                onClick={loadQuotes}
                className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
              >
                Refresh Quotes
              </button>
            </div>

            {loadingQuotes ? (
              <LoadingState message="Loading quotes..." />
            ) : quotes.length === 0 ? (
              <p className="text-xs text-white/60">No quotes found.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-soft-card">
                <table className="min-w-full text-xs">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Quote
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Customer
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Route
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Vehicle
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => {
                      const name = [q.first_name, q.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                      const vehicle = [
                        q.vehicle_year ?? "",
                        q.vehicle_make ?? "",
                        q.vehicle_model ?? "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                      return (
                        <tr
                          key={q.id}
                          className="border-t border-white/5 hover:bg-white/5"
                        >
                          <td className="px-3 py-2 font-mono text-[11px]">
                            {q.referenceId ?? q.id}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span>{name || "—"}</span>
                              <span className="text-[10px] text-white/50">
                                {q.customer_email || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span>
                              {q.pickup_city || "—"}, {q.pickup_state || "—"} →{" "}
                              {q.delivery_city || "—"}, {q.delivery_state || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2">{vehicle || "—"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={() => handleConvertQuote(q.id)}
                                disabled={convertingId === q.id || closingId === q.id}
                                className="rounded-full bg-brand-red px-4 py-2 text-[11px] font-semibold text-white hover:bg-brand-redSoft disabled:opacity-60"
                              >
                                {convertingId === q.id
                                  ? "Converting…"
                                  : "Convert → Shipment"}
                              </button>

                              <button
                                onClick={() => handleCloseQuoteNotConverted(q.id)}
                                disabled={closingId === q.id || convertingId === q.id}
                                className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft disabled:opacity-60"
                                title={`Sets status to: ${QUOTE_STATUS_CLOSED_NOT_CONVERTED}`}
                              >
                                {closingId === q.id
                                  ? "Closing…"
                                  : "Close (Not Converted)"}
                              </button>

                              <button
                                onClick={() => handleMarkConverted(q.id)}
                                disabled={closingId === q.id || convertingId === q.id}
                                className="mt-1 text-xs text-white/60 hover:text-white underline decoration-white/30 underline-offset-4"
                                title="Hide from list (mark as Converted) without creating a shipment"
                              >
                                Mark as Already Converted
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AdminShipmentsPage;
