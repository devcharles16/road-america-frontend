// src/pages/QuotePage.tsx
import { useState } from "react";
import { API_BASE_URL } from "../config/api";
import {
  createTransportRequest,
  type RunningCondition,
  type TransportType,
  type TransportRequest,
} from "../services/shipmentsService";

type QuoteFormState = {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  runningCondition: RunningCondition;
  transportType: TransportType;
  name: string;
  email: string;
  phone: string;
};

const defaultForm: QuoteFormState = {
  pickupCity: "",
  pickupState: "",
  deliveryCity: "",
  deliveryState: "",
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vin: "",
  runningCondition: "running",
  transportType: "open",
  name: "",
  email: "",
  phone: "",
};

const QuotePage = () => {
  const [form, setForm] = useState<QuoteFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [createdShipment, setCreatedShipment] = useState<TransportRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setCreatedShipment(null);

  try {
    // 1️⃣ Create the transport request (what you already had)
    const normalizedYear = /^\d{4}$/.test(form.vehicleYear) ? form.vehicleYear : undefined;

    const created = await createTransportRequest({
      pickupCity: form.pickupCity,
      pickupState: form.pickupState,
      deliveryCity: form.deliveryCity,
      deliveryState: form.deliveryState,
      vehicleYear: normalizedYear,
      vehicleMake: form.vehicleMake || undefined,
      vehicleModel: form.vehicleModel || undefined,
      vin: form.vin || undefined,
      runningCondition: form.runningCondition,
      transportType: form.transportType,
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone || undefined,
    });

    setCreatedShipment(created);

    // 2️⃣ Fire the email notification to your backend (Resend runs there)
    //    This should NOT block the user experience if it fails
  
    const pickup = `${form.pickupCity}, ${form.pickupState}`;
    const dropoff = `${form.deliveryCity}, ${form.deliveryState}`;

    // Do this in a "best-effort" way — log errors but don't show user an error
    fetch(`${API_BASE_URL}/api/notifications/new-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  name: form.name,
  email: form.email,
  phone: form.phone,
  pickup,
  dropoff,

  vehicleYear: normalizedYear,
  vehicleMake: form.vehicleMake || undefined,
  vehicleModel: form.vehicleModel || undefined,

  transportType: form.transportType,
  referenceId: created.referenceId,
}),

    }).catch((notifyErr) => {
      console.error("Failed to send new quote notification:", notifyErr);
    });

    // If you want to clear the form after submit, uncomment:
    // setForm(defaultForm);
  } catch (err) {
    console.error(err);
    setError("Something went wrong submitting your quote request.");
  } finally {
    setLoading(false);
  }
}


  return (
    <section className="bg-brand-dark py-12 text-white">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
            Request a Quote
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Vehicle Transport Quote
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Share a few details about your vehicle and route. We’ll create a
            transport request and follow up with pricing by email or phone.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-black/40 p-6 shadow-soft-card border border-white/10"
        >
          {/* Pickup & Delivery */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                Pickup Location
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/70">
                    City
                  </label>
                  <input
                    type="text"
                    name="pickupCity"
                    value={form.pickupCity}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">
                    State
                  </label>
                  <input
                    type="text"
                    name="pickupState"
                    value={form.pickupState}
                    onChange={handleChange}
                    placeholder="e.g. FL"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                Delivery Location
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/70">
                    City
                  </label>
                  <input
                    type="text"
                    name="deliveryCity"
                    value={form.deliveryCity}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">
                    State
                  </label>
                  <input
                    type="text"
                    name="deliveryState"
                    value={form.deliveryState}
                    onChange={handleChange}
                    placeholder="e.g. TX"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
              Vehicle Details
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">
                  Year
                </label>
                <input
                  type="text"
                  name="vehicleYear"
                  value={form.vehicleYear}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">
                  Make
                </label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={form.vehicleMake}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/70">
                  Model
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={form.vehicleModel}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-white/70">
                  VIN (optional, helps us auto-verify details later)
                </label>
                <input
                  type="text"
                  name="vin"
                  value={form.vin}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-white/70">
                    Running Condition
                  </label>
                  <select
                    name="runningCondition"
                    value={form.runningCondition}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  >
                    <option value="running">Running</option>
                    <option value="non-running">Non-Running</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/70">
                    Transport Type
                  </label>
                  <select
                    name="transportType"
                    value={form.transportType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  >
                    <option value="open">Open Carrier</option>
                    <option value="enclosed">Enclosed Carrier</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
              Your Contact Info
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-red px-8 py-3 text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Quote Request"}
            </button>
            <p className="text-xs text-white/60">
              By submitting, you agree to be contacted about your quote request.
            </p>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {createdShipment && (
              <div className="mt-2 rounded-xl bg-brand-dark/70 px-4 py-3 text-xs text-white/80 border border-brand-red/40">
                <p className="font-semibold text-brand-redSoft">
                  Thank you! Your transport request has been created.
                </p>
                <p className="mt-1">
                  Reference ID:{" "}
                  <span className="font-mono">
                    {createdShipment.referenceId}
                  </span>
                </p>
                <p className="mt-1 text-white/70">
                  You can use this Reference ID and your email to track your
                  shipment on the <span className="font-semibold">Track Shipment</span> page.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default QuotePage;
