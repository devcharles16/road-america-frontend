// src/pages/QuotePage.tsx
import { useState } from "react";
import { US_STATES } from "../services/states";

import { API_BASE_URL } from "../config/api";
import {
  createQuote,
  type QuoteCreated,
  type RunningCondition,
  type TransportType,
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
  vehicleHeightMod: "stock" | "lifted" | "lowered" | "not_sure";
  transportType: TransportType;
  preferredPickupWindow: "asap_1_3" | "this_week" | "next_1_2_weeks" | "flexible";

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const SHOW_VIN = false;

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
  vehicleHeightMod: "stock",
  transportType: "open",
  preferredPickupWindow: "asap_1_3",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const QuotePage = () => {
  const [form, setForm] = useState<QuoteFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  
  const [createdQuote, setCreatedQuote] = useState<QuoteCreated | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }
function handleCapitalizeBlur(
  field: keyof QuoteFormState
) {
  return (e: React.FocusEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: capitalizeFirst(e.target.value.trim()),
    }));
  };
}

;
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setCreatedQuote(null);

  try {
    // 0) Get captcha token
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
    if (!siteKey) {
      throw new Error("Missing VITE_RECAPTCHA_SITE_KEY");
    }

    if (!window.grecaptcha) {
      throw new Error("Captcha not ready. Please refresh and try again.");
    }

    const captchaToken: string = await new Promise((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, {
            action: "submit_quote",
          });
          resolve(token);
        } catch (err) {
          reject(err);
        }
      });
    });

    const normalizedYear =
      /^\d{4}$/.test(form.vehicleYear) ? form.vehicleYear : undefined;

    // 1) Create a QUOTE (not a shipment)
    const created = await createQuote({
      firstName: form.firstName,
      lastName: form.lastName,
      customerEmail: form.email,
      customerPhone: form.phone || undefined,

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
      preferredPickupWindow: form.preferredPickupWindow,
      vehicleHeightMod: form.vehicleHeightMod,

      // 2) send captcha token to backend
      captchaToken,
    });

    setCreatedQuote(created);

    // ... keep your existing notification fetch exactly as-is ...


      // 2) Best-effort email notification (keep this)
      const pickup = `${form.pickupCity}, ${form.pickupState}`;
      const dropoff = `${form.deliveryCity}, ${form.deliveryState}`;

      fetch(`${API_BASE_URL}/api/notifications/new-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          pickup,
          dropoff,

          vehicleYear: normalizedYear,
          vehicleMake: form.vehicleMake || undefined,
          vehicleModel: form.vehicleModel || undefined,

          transportType: form.transportType,
          runningCondition: form.runningCondition,
          vehicleHeightMod: form.vehicleHeightMod,
          preferredPickupWindow: form.preferredPickupWindow,

          // IMPORTANT: reference id is now from the quote record
          referenceId: created.referenceId,
        }),
      }).catch((notifyErr) => {
        console.error("Failed to send new quote notification:", notifyErr);
      });

      // Optional: clear the form
      // setForm(defaultForm);
    } catch (err) {
      console.error(err);
      setError("Something went wrong submitting your quote request.");
    } finally {
      setLoading(false);
    }
  }
const requiredValues = [
  form.firstName,
  form.lastName,
  form.email,
  form.phone,
  form.pickupCity,
  form.pickupState,
  form.deliveryCity,
  form.deliveryState,
  form.vehicleYear,
  form.vehicleMake,
  form.vehicleModel,
  form.runningCondition,
  form.transportType,
  form.preferredPickupWindow,
  form.vehicleHeightMod,
];

const isFormValid = requiredValues.every(
  (v) => String(v ?? "").trim() !== ""
);
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
            Share a few details about your vehicle and route. We’ll follow up with
            pricing by email.
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
                  <label className="block text-xs text-white/70">City</label>
                  <input
                    type="text"
                    name="pickupCity"
                    value={form.pickupCity}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("pickupCity")}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">State</label>
                 <select
  name="pickupState"
  value={form.pickupState}
  onChange={handleChange}
  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
  required
>
  <option value="">Select state</option>
  {US_STATES.map((state) => (
    <option key={state.code} value={state.code}>
      {state.name}
    </option>
  ))}
</select>


                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                Delivery Location
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/70">City</label>
                  <input
                    type="text"
                    name="deliveryCity"
                    value={form.deliveryCity}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("deliveryCity")}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">State</label>
                  <select
  name="deliveryState"
  value={form.deliveryState}
  onChange={handleChange}
  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
  required
>
  <option value="">Select state</option>
  {US_STATES.map((state) => (
    <option key={state.code} value={state.code}>
      {state.name}
    </option>
  ))}
</select>

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
                <label className="block text-xs text-white/70">Year</label>
                <input
                  type="text"
                  name="vehicleYear"
                  value={form.vehicleYear}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">Make</label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={form.vehicleMake}
                  onChange={handleChange}
                  onBlur={handleCapitalizeBlur("vehicleMake")}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required/>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-white/70">Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={form.vehicleModel}
                  onChange={handleChange}
                  onBlur={handleCapitalizeBlur("vehicleModel")}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required
                />
              </div>
            </div>

            <div className={`mt-4 grid gap-4 ${SHOW_VIN ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
              {SHOW_VIN && (
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
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-white/70">Running Condition</label>
                  <select
                    name="runningCondition"
                    value={form.runningCondition}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  >
                     <option value="">Select Running Condition</option>
                    <option value="running">Running</option>
                    <option value="non-running">Non-Running</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/70">
                    Vehicle Height/Modifications
                  </label>
                  <select
                    name="vehicleHeightMod"
                    value={form.vehicleHeightMod}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                    required
                  >
                     <option value="">Select Vehicle Height</option>
                    <option value="stock">Stock (no lift or lowering)</option>
                    <option value="lifted">Lifted</option>
                    <option value="lowered">Lowered</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/70">Transport Type</label>
                  <select
                    name="transportType"
                    value={form.transportType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  >
                     <option value="">Select Transport Type</option>
                    <option value="open">Open Carrier</option>
                    <option value="enclosed">Enclosed Carrier</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preferred Pickup Window */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
              Pickup Timing
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-white/70">
                  Preferred Pickup Window
                </label>
                <select
                  name="preferredPickupWindow"
                  value={form.preferredPickupWindow}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                >
                   <option value="">Select Pickup Window</option>
                  <option value="asap_1_3">ASAP (1-3 days)</option>
                  <option value="this_week">This week</option>
                  <option value="next_1_2_weeks">Next 1-2 weeks</option>
                  <option value="flexible">Flexible / No rush</option>
                </select>
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
                <label className="block text-xs text-white/70">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  onBlur={handleCapitalizeBlur("firstName")}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  onBlur={handleCapitalizeBlur("lastName")}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs text-white/70">Email</label>
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
                <label className="block text-xs text-white/70">Mobile Phone</label>
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
           <p className="text-xs text-white/70 italic text-center">
    *All fields are required
  </p>
  <button
    type="submit"
    disabled={loading || !isFormValid}
    className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-white shadow-soft-card transition
      ${
        loading || !isFormValid
          ? "bg-brand-red/60 cursor-not-allowed"
          : "bg-brand-red hover:bg-brand-redSoft"
      }
    `}
  >
    {loading ? "Submitting..." : "Get My Transport Quote"}
  </button>

  <p className="text-xs text-white/60 text-center">
    By submitting, you agree to be contacted about your quote request.
  </p>
            {error && <p className="text-xs text-red-400">{error}</p>}

            {createdQuote && (
              <div className="mt-2 rounded-xl bg-brand-dark/70 px-4 py-3 text-xs text-white/80 border border-brand-red/40">
                <p className="font-semibold text-brand-redSoft">
                  Thank you! Your quote request has been received.
                </p>
                <p className="mt-1">
                  Reference ID:{" "}
                  <span className="font-mono">{createdQuote.referenceId}</span>
                </p>
                <p className="mt-1 text-white/70">
                  Save this Reference ID. If you decide to proceed, we’ll use the
                  same Reference ID when your quote becomes an active shipment.
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
