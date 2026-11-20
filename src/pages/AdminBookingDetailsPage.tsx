import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import {
  adminGetBooking,
  adminResolveBookingReview,
  type AdminBookingView,
} from "../services/adminBookingsService";

const REFERENCE_RE = /^RA-\d{5,12}$/i;

const PICKUP_WINDOW_LABELS: Record<string, string> = {
  asap_1_3: "ASAP (1–3 days)",
  this_week: "This week",
  next_1_2_weeks: "Next 1–2 weeks",
  flexible: "Flexible / No rush",
};

const HEIGHT_MOD_LABELS: Record<string, string> = {
  stock: "Stock (no lift or lowering)",
  lifted: "Lifted",
  lowered: "Lowered",
  not_sure: "Not sure",
};

const STATUS_LABELS: Record<string, string> = {
  ready_for_payment: "Ready for payment",
  review_required: "Review required",
  payment_authorized: "Payment authorized",
  posted_to_central_dispatch: "Posted to Central Dispatch",
};

function friendly(map: Record<string, string>, value?: string | null) {
  if (!value) return "—";
  return map[value] ?? value;
}

function money(value?: number | null) {
  if (value == null) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function StatusBadge({ status }: { status?: string | null }) {
  const label = status ? STATUS_LABELS[status] ?? status : "No booking details yet";
  const tone =
    status === "ready_for_payment"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : status === "review_required"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : status
      ? "bg-slate-100 text-slate-700 border-slate-300"
      : "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="min-w-[160px] font-semibold text-text-muted">{label}</span>
      <span className="text-text-primary">{value == null || value === "" ? "—" : value}</span>
    </div>
  );
}

export default function AdminBookingDetailsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [referenceInput, setReferenceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AdminBookingView | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const reference = referenceInput.trim().toUpperCase();
    if (!REFERENCE_RE.test(reference)) {
      setError("Enter a valid reference, e.g. RA-100210.");
      return;
    }
    setLoading(true);
    setError(null);
    setView(null);
    try {
      const result = await adminGetBooking(reference);
      setView(result);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load booking.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve() {
    const referenceId = view?.quote?.reference_id;
    const revision = view?.details?.revision;
    if (!referenceId || revision == null) return;
    if (!confirm("Approve the pickup/delivery details currently on file for this booking? This clears the review flag.")) return;
    setResolving(true);
    try {
      await adminResolveBookingReview(referenceId, revision);
      const refreshed = await adminGetBooking(referenceId);
      setView(refreshed);
    } catch (e: any) {
      // A stale-revision rejection still means the booking changed — the
      // refreshed view below shows what it is now rather than leaving the
      // page showing what the admin reviewed a moment ago.
      alert(e?.message ?? "Failed to resolve review.");
      try {
        setView(await adminGetBooking(referenceId));
      } catch {
        /* best-effort refresh; the alert above already told the admin what happened */
      }
    } finally {
      setResolving(false);
    }
  }

  const quote = view?.quote;
  const selection = view?.selection;
  const details = view?.details;

  return (
    <section className="min-h-[70vh]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Booking Details</h1>
          <p className="mt-1 text-sm text-text-muted">
            Search a quote reference to review its pickup/delivery details, package selection, and status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="reference" className="text-xs font-semibold text-text-muted">
            Quote reference
          </label>
          <input
            id="reference"
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            placeholder="RA-100210"
            className="mt-1 w-56 rounded-lg border border-[#172B3D]/15 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-redSoft px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <LoadingState className="mt-8" />}

      {view && quote && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-[#172B3D]/10 bg-background-warm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-text-muted">Reference</p>
                <p className="font-display text-xl font-semibold">{quote.reference_id}</p>
              </div>
              <StatusBadge status={details?.status} />
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Field label="Customer" value={`${quote.first_name ?? ""} ${quote.last_name ?? ""}`.trim() || "—"} />
              <Field label="Email" value={quote.customer_email} />
              <Field label="Phone" value={quote.customer_phone} />
              <Field
                label="Vehicle"
                value={[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(" ") || "—"}
              />
              <Field label="Transport type" value={quote.transport_type === "enclosed" ? "Enclosed transport" : quote.transport_type === "open" ? "Open transport" : quote.transport_type} />
              <Field label="Pickup window" value={friendly(PICKUP_WINDOW_LABELS, quote.pickup_window)} />
              <Field label="Vehicle height / mods" value={friendly(HEIGHT_MOD_LABELS, quote.vehicle_height_mod)} />
              <Field label="Running condition" value={quote.running_condition} />
            </div>
          </div>

          <div className="rounded-xl border border-[#172B3D]/10 bg-background-warm p-5">
            <h2 className="font-display text-lg font-semibold">Package &amp; pricing</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Field
                label="Selected package"
                value={selection?.package ? (selection.package === "gold" ? "Gold All-Inclusive" : "Silver Cash Discount") : "Not selected yet"}
              />
              <Field label="Pricing status" value={quote.pricing_status ?? "Not yet approved"} />
              <Field label="Silver total" value={money(quote.silver_total_price)} />
              <Field label="Gold total" value={money(quote.gold_total_price)} />
            </div>
          </div>

          <div className="rounded-xl border border-[#172B3D]/10 bg-background-warm p-5">
            <h2 className="font-display text-lg font-semibold">Pickup &amp; delivery details</h2>
            {!details ? (
              <p className="mt-3 text-sm text-text-muted">The customer hasn't submitted their booking details yet.</p>
            ) : (
              <>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Pickup</p>
                    <div className="mt-2 space-y-1">
                      <Field label="Address" value={[details.pickup_address, details.pickup_unit].filter(Boolean).join(", ")} />
                      <Field label="City/State/ZIP" value={[details.pickup_city, details.pickup_state, details.pickup_zip].filter(Boolean).join(", ")} />
                      <Field label="Contact" value={details.pickup_contact_name} />
                      <Field label="Phone" value={details.pickup_contact_phone} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Delivery</p>
                    <div className="mt-2 space-y-1">
                      <Field label="Address" value={[details.delivery_address, details.delivery_unit].filter(Boolean).join(", ")} />
                      <Field label="City/State/ZIP" value={[details.delivery_city, details.delivery_state, details.delivery_zip].filter(Boolean).join(", ")} />
                      <Field label="Contact" value={details.delivery_contact_name} />
                      <Field label="Phone" value={details.delivery_contact_phone} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <Field label="Vehicle available" value={details.vehicle_available_date} />
                  <Field label="Special instructions" value={details.special_instructions || "None provided"} />
                  <Field label="Revision" value={details.revision ?? undefined} />
                  <Field
                    label="Customer confirmation"
                    value={details.pending_customer_confirmation ? "Awaiting customer confirmation" : "Not required"}
                  />
                </div>

                {details.status === "review_required" && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <p className="text-sm text-amber-900">
                      The pickup or delivery city/state/ZIP, availability date, or special instructions no longer
                      match what was originally quoted or previously approved. This booking cannot proceed to
                      payment authorization until this is resolved.
                    </p>
                    {isAdmin ? (
                      <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {resolving ? "Resolving…" : "Approve current details"}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-amber-800">
                        Only an administrator can resolve this. Escalate if the customer needs to proceed.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-[#172B3D]/10 bg-background-warm p-5">
              <h2 className="font-display text-lg font-semibold">Audit history</h2>
              {!view.auditLog || view.auditLog.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No audit entries yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {view.auditLog.map((entry, i) => (
                    <li key={i} className="rounded-lg border border-[#172B3D]/10 p-3">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">{entry.action.replace(/_/g, " ")}</span>
                        <span className="text-text-muted">{formatDateTime(entry.performed_at)}</span>
                      </div>
                      {entry.details && (
                        <pre className="mt-1 overflow-x-auto text-xs text-text-muted">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
