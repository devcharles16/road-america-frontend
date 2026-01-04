import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminConvertQuoteToShipment, adminListQuotes } from "../services/quotesService";

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
  transport_type?: string | null;
  running_condition?: string | null;
  pickup_window?: string | null;
  vehicle_height_mod?: string | null;
  quote_status?: string | null;
  created_at?: string | null;
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminListQuotes();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => quotes, [quotes]);

  async function handleConvert(quoteId: string, userId?: string | null) {
    setConvertingId(quoteId);
    try {
      await adminConvertQuoteToShipment(quoteId, userId ?? null);
      navigate("/admin", { replace: true });
    } catch (e: any) {
      alert(e?.message ?? "Failed to convert quote");
    } finally {
      setConvertingId(null);
    }
  }
  



  return (
    <section className="bg-brand-dark text-white min-h-[70vh] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
              Admin
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold">
              Quotes
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Review new quote requests and convert them into shipments.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 shadow-soft-card overflow-hidden">
          {loading ? (
            <div className="p-6 text-white/70">Loading quotes…</div>
          ) : err ? (
            <div className="p-6 text-red-300">{err}</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-white/70">No quotes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr className="text-left">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Pickup Window</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((q) => {
                    const name = [q.first_name, q.last_name].filter(Boolean).join(" ").trim();
                    const route = `${q.pickup_city ?? ""}, ${q.pickup_state ?? ""} → ${q.delivery_city ?? ""}, ${q.delivery_state ?? ""}`.trim();
                    const vehicle = [q.vehicle_year, q.vehicle_make, q.vehicle_model].filter(Boolean).join(" ");

                    return (
                      <tr key={q.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">
                            {name || "—"}
                          </div>
                          <div className="text-xs text-white/60">
                            {q.customer_email ?? "—"}
                          </div>
                          <div className="text-xs text-white/60">
  {q.referenceId ?? q.id}
</div>

                        </td>

                        <td className="px-4 py-3">
                          <div className="text-white/80">{route || "—"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-white/80">{vehicle || "—"}</div>
                          <div className="text-xs text-white/60">
                            {q.transport_type ?? "—"} · {q.running_condition ?? "—"}
                          </div>
                          <div className="text-xs text-white/60">
                            Height/Mods: {q.vehicle_height_mod ?? "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-white/80">{q.pickup_window ?? "—"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                            {q.quote_status ?? "New"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={convertingId === q.id}
                            onClick={() => handleConvert(q.id)}
                            className="inline-flex items-center justify-center rounded-full bg-brand-red px-4 py-2 text-xs font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
                          >
                            {convertingId === q.id ? "Converting…" : "Convert to Shipment"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
