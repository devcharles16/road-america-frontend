import { useState, useEffect } from "react";
import { US_STATES } from "../services/states";
import SEO from "../components/SEO";
import { API_BASE_URL } from "../config/api";
import {
  createQuote,
  type RunningCondition,
  type TransportType,
} from "../services/shipmentsService";
import { fetchNhtsaMakes, fetchNhtsaModels, getVehicleYears } from "../services/nhtsaService";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Search } from "lucide-react";
import { Link } from "react-router-dom";

type QuoteFormState = {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  runningCondition: RunningCondition;
  vehicleHeightMod: "stock" | "lifted" | "lowered" | "oversized" | "not_sure";
  transportType: TransportType;
  preferredPickupWindow: "asap_1_3" | "this_week" | "flexible";
  firstName: string;
  lastName: string;
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

const POPULAR_MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Acura"
];

const QuotePageAB = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<QuoteFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data fetching state for Make/Model
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Local UI state
  const [showOtherYears, setShowOtherYears] = useState(false);
  const [showOtherMakes, setShowOtherMakes] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const totalSteps = 11;
  const progressPercent = Math.min(((step - 1) / totalSteps) * 100, 100);

  useEffect(() => {
    setYears(getVehicleYears());
    fetchNhtsaMakes().then(setMakes);
  }, []);

  useEffect(() => {
    if (step === 5 && form.vehicleYear && form.vehicleMake) {
      setLoadingModels(true);
      fetchNhtsaModels(form.vehicleYear, form.vehicleMake).then((data) => {
        setModels(data);
        setLoadingModels(false);
      });
    }
  }, [step, form.vehicleYear, form.vehicleMake]);

  // Auto-advance logic for screens that only need one tap
  const handleTapSelection = (field: keyof QuoteFormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    nextStep();
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapitalizeBlur = (field: keyof QuoteFormState) => {
    return (e: React.FocusEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: capitalizeFirst(e.target.value.trim()),
      }));
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
      if (!siteKey) throw new Error("Missing VITE_RECAPTCHA_SITE_KEY");
      if (!window.grecaptcha) throw new Error("Captcha not ready. Please refresh.");

      const captchaToken: string = await new Promise((resolve, reject) => {
        window.grecaptcha!.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(siteKey, {
              action: "submit_quote_ab",
            });
            resolve(token);
          } catch (err) {
            reject(err);
          }
        });
      });

      const created = await createQuote({
        firstName: form.firstName,
        lastName: form.lastName,
        customerEmail: form.email,
        customerPhone: form.phone || undefined,
        pickupCity: form.pickupCity,
        pickupState: form.pickupState,
        deliveryCity: form.deliveryCity,
        deliveryState: form.deliveryState,
        vehicleYear: form.vehicleYear,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        runningCondition: form.runningCondition,
        transportType: form.transportType,
        preferredPickupWindow: form.preferredPickupWindow as any,
        vehicleHeightMod: form.vehicleHeightMod as any,
        captchaToken,
      });

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
          vehicleYear: form.vehicleYear,
          vehicleMake: form.vehicleMake,
          vehicleModel: form.vehicleModel,
          transportType: form.transportType,
          runningCondition: form.runningCondition,
          vehicleHeightMod: form.vehicleHeightMod,
          preferredPickupWindow: form.preferredPickupWindow,
          referenceId: created.referenceId,
        }),
      }).catch(console.error);

      nextStep(); // Go to success screen (step 12)
    } catch (err) {
      console.error(err);
      setError("Something went wrong submitting your quote request.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = form.pickupCity.trim() !== "" && form.pickupState !== "";
  const isStep2Valid = form.deliveryCity.trim() !== "" && form.deliveryState !== "";
  const isStep11Valid = form.firstName.trim() !== "" && form.email.trim() !== "" && form.phone.trim() !== "";

  const filteredMakes = makes.filter(m => m.toLowerCase().includes(makeSearch.toLowerCase()));
  const filteredModels = models.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()));

  // Reusable button styles for mobile-friendliness
  const tapButtonClass = "w-full bg-white/5 border border-white/10 hover:border-brand-red hover:bg-brand-red/10 text-white rounded-2xl p-5 text-left font-medium transition-all flex items-center justify-between group";

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col font-sans">
      <SEO title="Get A Quote" description="Car Shipping Made Simple" />

      {/* Header / Progress */}
      {step < 12 && (
        <div className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            {step > 1 && (
              <button onClick={prevStep} className="p-2 -ml-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-red transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-xs font-semibold text-white/50 w-10 text-right">
              {Math.round(progressPercent)}%
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 md:py-12 flex flex-col">
        {/* Step 1: Pickup */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-semibold mb-3">Car Shipping Made Simple</h1>
              <p className="text-white/70 text-lg">We price your shipment to get it picked up — not ignored.</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 className="text-xl font-medium mb-2">Pickup Location</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">City</label>
                  <input
                    type="text"
                    name="pickupCity"
                    value={form.pickupCity}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("pickupCity")}
                    placeholder="e.g. Miami"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">State</label>
                  <div className="relative">
                    <select
                      name="pickupState"
                      value={form.pickupState}
                      onChange={handleChange}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white appearance-none focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition text-lg"
                    >
                      <option value="" className="text-gray-900">Select state...</option>
                      {US_STATES.map((state) => (
                        <option key={state.code} value={state.code} className="text-gray-900">
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!isStep1Valid}
                className="w-full h-14 mt-6 bg-brand-red hover:bg-brand-redSoft disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Delivery */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <p className="text-brand-redSoft text-sm font-medium mb-6 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking active carrier routes...
            </p>

            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 className="text-2xl font-medium mb-2">Delivery Location</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">City</label>
                  <input
                    type="text"
                    name="deliveryCity"
                    value={form.deliveryCity}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("deliveryCity")}
                    placeholder="e.g. Los Angeles"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition text-lg"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">State</label>
                  <div className="relative">
                    <select
                      name="deliveryState"
                      value={form.deliveryState}
                      onChange={handleChange}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white appearance-none focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition text-lg"
                    >
                      <option value="" className="text-gray-900">Select state...</option>
                      {US_STATES.map((state) => (
                        <option key={state.code} value={state.code} className="text-gray-900">
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!isStep2Valid}
                className="w-full h-14 mt-6 bg-brand-red hover:bg-brand-redSoft disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Vehicle Year */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <p className="text-brand-redSoft text-sm font-medium mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Route available: {form.pickupCity} to {form.deliveryCity}
            </p>

            <h2 className="text-2xl font-medium mb-6">Vehicle Year</h2>
            
            <div className="space-y-3">
              {["2026", "2025", "2024"].map(yr => (
                <button
                  key={yr}
                  onClick={() => handleTapSelection("vehicleYear", yr)}
                  className={tapButtonClass}
                >
                  <span className="text-xl">{yr}</span>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand-red transition" />
                </button>
              ))}

              {!showOtherYears ? (
                <button
                  onClick={() => setShowOtherYears(true)}
                  className={tapButtonClass}
                >
                  <span className="text-xl">Older</span>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand-red transition" />
                </button>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative">
                  <select
                    value={form.vehicleYear}
                    onChange={(e) => {
                      if (e.target.value) handleTapSelection("vehicleYear", e.target.value);
                    }}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-5 text-white appearance-none focus:border-brand-red outline-none text-xl"
                    autoFocus
                  >
                    <option value="" className="text-gray-900">Select Year...</option>
                    {years.map(y => (
                      <option key={y} value={y} className="text-gray-900">{y}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 rotate-90 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Vehicle Make */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-medium mb-6">Vehicle Make</h2>
            
            {!showOtherMakes ? (
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_MAKES.map(m => (
                  <button
                    key={m}
                    onClick={() => handleTapSelection("vehicleMake", m)}
                    className="bg-white/5 border border-white/10 hover:border-brand-red hover:bg-brand-red/10 rounded-2xl p-4 text-center font-medium transition-all text-lg"
                  >
                    {m}
                  </button>
                ))}
                <button
                  onClick={() => setShowOtherMakes(true)}
                  className="bg-white/5 border border-white/10 hover:border-brand-red hover:bg-brand-red/10 rounded-2xl p-4 text-center font-medium transition-all text-lg text-white/70"
                >
                  Other Make
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col h-[60vh]">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input 
                    type="text" 
                    placeholder="Search makes..." 
                    value={makeSearch}
                    onChange={e => setMakeSearch(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 focus:border-brand-red outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredMakes.map(m => (
                    <button
                      key={m}
                      onClick={() => handleTapSelection("vehicleMake", m)}
                      className="w-full bg-white/5 hover:bg-brand-red/20 rounded-xl p-4 text-left font-medium transition-all"
                    >
                      {m}
                    </button>
                  ))}
                  {filteredMakes.length === 0 && (
                    <p className="text-white/50 text-center py-4">No makes found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Vehicle Model */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-[70vh]">
            <h2 className="text-2xl font-medium mb-2">Vehicle Model</h2>
            <p className="text-white/60 mb-6">{form.vehicleYear} {form.vehicleMake}</p>
            
            {loadingModels ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input 
                    type="text" 
                    placeholder="Search models..." 
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 focus:border-brand-red outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredModels.map(m => (
                    <button
                      key={m}
                      onClick={() => handleTapSelection("vehicleModel", m)}
                      className="w-full bg-white/5 hover:bg-brand-red/20 rounded-xl p-4 text-left font-medium transition-all"
                    >
                      {m}
                    </button>
                  ))}
                  {filteredModels.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/50 mb-4">Model not found?</p>
                      <input 
                        type="text"
                        placeholder="Type it here..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            handleTapSelection("vehicleModel", e.currentTarget.value);
                          }
                        }}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-brand-red outline-none text-center"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 6: Running Condition */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-medium mb-6">Running Condition</h2>
            <div className="space-y-4">
              <button onClick={() => handleTapSelection("runningCondition", "running")} className={tapButtonClass}>
                <div className="text-left">
                  <div className="text-xl font-medium mb-1">Running</div>
                  <div className="text-sm text-white/50">Starts, drives, steers, and brakes.</div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-brand-red opacity-0 group-hover:opacity-100 transition" />
              </button>
              <button onClick={() => handleTapSelection("runningCondition", "non-running")} className={tapButtonClass}>
                <div className="text-left">
                  <div className="text-xl font-medium mb-1">Inoperable</div>
                  <div className="text-sm text-white/50">Requires winch or forklift to load.</div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-brand-red opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Vehicle Height / Mods */}
        {step === 7 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-medium mb-6">Vehicle Modifications</h2>
            <div className="space-y-3">
              {[
                { val: "stock", label: "Stock", desc: "Factory height" },
                { val: "lifted", label: "Lifted", desc: "Suspension lift" },
                { val: "lowered", label: "Lowered", desc: "Dropped suspension" },
                { val: "oversized", label: "Oversized Tires", desc: "Larger than factory" }
              ].map(opt => (
                <button key={opt.val} onClick={() => handleTapSelection("vehicleHeightMod", opt.val)} className={tapButtonClass}>
                  <div className="text-left">
                    <div className="text-lg font-medium">{opt.label}</div>
                    <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand-red transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Transport Type */}
        {step === 8 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
             <p className="text-brand-redSoft text-sm font-medium mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Your route is eligible for Open & Enclosed transport.
            </p>
            <h2 className="text-2xl font-medium mb-6">Transport Type</h2>
            
            <div className="grid gap-4">
              <button onClick={() => handleTapSelection("transportType", "open")} className="w-full bg-white/5 border border-white/10 hover:border-brand-red hover:bg-brand-red/10 rounded-3xl p-6 text-left transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xl font-bold text-white">Open Transport</div>
                  <span className="bg-brand-red/20 text-brand-red text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Most Affordable</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">Standard method. Your vehicle is exposed to the elements, similar to regular driving. 90% of customers choose this.</p>
              </button>

              <button onClick={() => handleTapSelection("transportType", "enclosed")} className="w-full bg-white/5 border border-white/10 hover:border-brand-red hover:bg-brand-red/10 rounded-3xl p-6 text-left transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xl font-bold text-white">Enclosed Transport</div>
                  <span className="bg-white/10 text-white/80 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Added Protection</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">Fully protected from weather and road debris. Ideal for classic, luxury, or high-value vehicles.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 9: Pickup Window */}
        {step === 9 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-medium mb-6">Pickup Window</h2>
            <div className="space-y-3">
              {[
                { val: "asap_1_3", label: "ASAP (1-3 Days)", desc: "Need it moved quickly" },
                { val: "this_week", label: "This Week", desc: "Within the next 7 days" },
                { val: "flexible", label: "Flexible Timing", desc: "No rush, looking for best price" }
              ].map(opt => (
                <button key={opt.val} onClick={() => handleTapSelection("preferredPickupWindow", opt.val)} className={tapButtonClass}>
                  <div className="text-left">
                    <div className="text-lg font-medium">{opt.label}</div>
                    <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand-red transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 10: Trust Screen */}
        {step === 10 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-16 h-16 bg-brand-red/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-brand-red" />
            </div>
            <h2 className="text-3xl font-semibold mb-2">Good news —</h2>
            <p className="text-xl text-white/80 mb-8">We service your route.</p>

            <div className="space-y-4 text-left max-w-xs mx-auto mb-10 w-full">
              {[
                "Licensed & Bonded",
                "No Bait-and-Switch",
                "Real Carrier Pricing",
                "Real Human Support",
                "Rate Lock Available Once Booked"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-red shrink-0" />
                  <span className="font-medium text-white/90">{feat}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 p-4 rounded-xl mb-8 max-w-sm border border-white/10">
              <p className="text-xs text-white/60 leading-relaxed">
                <strong className="text-white/80">Did you know?</strong> Many low quotes never get picked up because carriers reject unrealistic pricing. Road America prices shipments to move.
              </p>
            </div>

            <button onClick={nextStep} className="w-full max-w-xs h-14 bg-brand-red hover:bg-brand-redSoft text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20">
              See My Options <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 11: Contact Info */}
        {step === 11 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-3xl font-semibold mb-2">Where should we send your quote?</h2>
            <p className="text-white/60 mb-8">Your quote is ready. We just need to know where to send it.</p>

            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("firstName")}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-brand-red outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Last Name <span className="text-white/30 text-xs font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleCapitalizeBlur("lastName")}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-brand-red outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-brand-red outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">Mobile Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-brand-red outline-none transition"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isStep11Valid}
                  className="w-full h-14 bg-brand-red hover:bg-brand-redSoft disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                  ) : (
                    "Get My Transport Quote"
                  )}
                </button>
                {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
                
                <p className="text-center text-xs text-white/40 mt-4 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> We do not spam or sell your information.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Final Screen */}
        {step === 12 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Thank You!</h2>
            <p className="text-xl text-white/80 mb-6">Your request has been received.</p>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-sm w-full">
               <p className="text-lg font-medium flex items-center justify-center gap-2">
                 📱 Watch for a text message shortly.
               </p>
            </div>

            <Link to="/" className="mt-10 text-white/50 hover:text-white transition underline underline-offset-4">
              Return to Homepage
            </Link>
          </div>
        )}

      </main>

      {/* Global reCAPTCHA hidden div if needed, already handled by index.html usually */}
    </div>
  );
};

export default QuotePageAB;
