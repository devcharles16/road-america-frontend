import { useState } from "react";
import {
  trackShipmentByRefAndEmail,
  type TransportRequest,
  type TransportStatus,
} from "../services/shipmentsService";

type TrackingFormState = {
  referenceId: string;
  email: string;
};

type TrackingStep = {
  id: TransportStatus;
  label: string;
  description: string;
};

const STATUS_STEPS: TrackingStep[] = [
  {
    id: "Submitted",
    label: "Submitted",
    description: "We received your transport request.",
  },
  {
    id: "Driver Assigned",
    label: "Driver Assigned",
    description: "A vetted carrier has been assigned to your vehicle.",
  },
  {
    id: "In Transit",
    label: "In Transit",
    description: "Your vehicle is currently on the way to its destination.",
  },
  {
    id: "Delivered",
    label: "Delivered",
    description: "Your vehicle has been delivered.",
  },
];

function getStepIndexForStatus(status: TransportStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.id === status);
  if (idx === -1) return 0;
  return idx;
}

const TrackingPage = () => {
  const [form, setForm] = useState<TrackingFormState>({
    referenceId: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<TransportRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShipment(null);

    try {
      const result = await trackShipmentByRefAndEmail(
        form.referenceId,
        form.email
      );
      if (!result) {
        setError(
          "We couldn't find a shipment with that Reference ID and email. Please double-check your details."
        );
      } else {
        setShipment(result);
        console.log("TRACK RESULT:", result);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching tracking details.");
    } finally {
      setLoading(false);
    }
  }

  const activeStepIndex =
    shipment != null ? getStepIndexForStatus(shipment.status) : 0;

  return (
    <section className="bg-brand-dark py-12 text-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
            Track Shipment
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Track Your Vehicle Transport
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Enter your Road America reference ID and the email used on your
            quote so we can display the latest status of your shipment.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Left: form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-black/40 p-5 shadow-soft-card border border-white/10"
          >
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Reference ID
              </label>
              <input
                type="text"
                name="referenceId"
                value={form.referenceId}
                onChange={handleChange}
                placeholder="e.g. RAU-10234"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email used with your quote"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>

            <p className="text-[11px] text-white/50 mt-2">
              Don’t see your status? Tracking will appear after payment is completed and your vehicle has been dispatched.
            </p>

            {error && (
              <p className="mt-2 text-[11px] text-red-400">
                {error}
              </p>
            )}
          </form>

          {/* Right: timeline */}
          <div className="rounded-2xl bg-black/40 p-5 shadow-soft-card border border-white/10">
            <h2 className="text-sm font-semibold mb-4">Shipment Status</h2>

            {!shipment && !loading && !error && (
              <p className="text-xs text-white/60">
                Enter your reference ID and email to view your shipment’s
                progress from quote to delivery.
              </p>
            )}

            {loading && (
              <p className="text-xs text-white/60">
                Looking up your shipment...
              </p>
            )}

            {shipment && (
              <>
                <div className="mb-4 flex items-center justify-between text-xs text-white/60">
                  <div>
                    <p className="text-[11px] uppercase text-white/50">
                      Current Status
                    </p>
                    <p className="text-sm font-semibold text-brand-redSoft">
                      {shipment.status}
                    </p>
                    {shipment.eta && (
                      <p className="mt-1 text-[11px] text-white/60">
                        ETA: {shipment.eta}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase text-white/50">
                      Reference
                    </p>
                    <p className="text-xs font-mono">
                      {shipment.referenceId}
                    </p>
                    <p className="mt-1 text-[11px] text-white/60">
                      {shipment.pickupCity}, {shipment.pickupState} →{" "}
                      {shipment.deliveryCity}, {shipment.deliveryState}
                    </p>
                  </div>
                </div>

                <ol className="relative border-l border-white/15 pl-4 mt-4 space-y-5">
                  {STATUS_STEPS.map((step, index) => {
                    const isActive = index === activeStepIndex;
                    const isCompleted = index < activeStepIndex;

                    return (
                      <li key={step.id} className="relative">
                        <span
                          className={[
                            "absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border",
                            isActive
                              ? "border-brand-red bg-brand-red"
                              : isCompleted
                              ? "border-brand-red bg-brand-red/40"
                              : "border-white/30 bg-brand-dark",
                          ].join(" ")}
                        >
                          {isCompleted ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <div className="ml-1">
                          <p
                            className={
                              "text-xs font-semibold " +
                              (isActive
                                ? "text-brand-redSoft"
                                : "text-white/80")
                            }
                          >
                            {step.label}
                          </p>
                          <p className="mt-1 text-[11px] text-white/60">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingPage;
