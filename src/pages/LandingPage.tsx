import { useState } from "react";
import { US_STATES } from "../services/states";
import QuoteSuccessModal from "../components/QuoteSuccessModal";
import { API_BASE_URL } from "../config/api";
import {
    createQuote,
    type QuoteCreated,
    type RunningCondition,
    type TransportType,
} from "../services/shipmentsService";
import { ShieldCheck, Truck, Clock, CheckCircle2, Star, ChevronDown, ChevronUp } from "lucide-react";

type QuoteFormState = {
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;

    runningCondition: RunningCondition;
    vehicleHeightMod: "stock" | "lifted" | "lowered" | "not_sure";
    transportType: TransportType;
    preferredPickupWindow: "asap_1_3" | "this_week" | "next_1_2_weeks" | "flexible";

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

const LandingPage = () => {
    const [form, setForm] = useState<QuoteFormState>(defaultForm);
    const [loading, setLoading] = useState(false);

    const [createdQuote, setCreatedQuote] = useState<QuoteCreated | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }
    function handleModalClose() {
        setShowSuccessModal(false);
        setCreatedQuote(null);
        setForm(defaultForm);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
                // vin: form.vin || undefined,

                runningCondition: form.runningCondition,
                transportType: form.transportType,
                preferredPickupWindow: form.preferredPickupWindow,
                vehicleHeightMod: form.vehicleHeightMod,

                // 2) send captcha token to backend
                captchaToken,
            });

            setCreatedQuote(created);
            setShowSuccessModal(true);

            // 2) Best-effort email notification
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
        <div className="bg-brand-dark min-h-screen text-white">

            {/* HER0 SECTION */}
            <section className="relative pt-6 pb-20 overflow-hidden">
                {/* Background Element */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-[#1a1a1a] to-brand-red/10" />
                    {/* subtle grid */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 flex flex-col lg:flex-row gap-12 items-start pt-8">
                    {/* Left Content */}
                    <div className="lg:w-1/2 pt-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-redSoft border border-brand-red/20 mb-6">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Rated 4.8/5 by 50,000+ Customers</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                            America's Most Trusted <span className="text-brand-redSoft">Auto Transport</span>
                        </h1>

                        <p className="text-lg text-white/70 mb-8 max-w-xl leading-relaxed">
                            We ship your vehicle safely and securely across all 50 states.
                            Get an instant free quote and see why thousands choose Road America.
                        </p>

                        <div className="flex flex-col gap-4 mb-10">
                            <div className="flex items-center gap-3 text-white/80">
                                <CheckCircle2 className="text-brand-redSoft" />
                                <span>Fully Insured & Bonded Carriers</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <CheckCircle2 className="text-brand-redSoft" />
                                <span>Door-to-Door Service</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <CheckCircle2 className="text-brand-redSoft" />
                                <span>No Upfront Deposit Required</span>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-6 max-w-md opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                            {/* Placeholder for badges - using text for now or simple icons */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <ShieldCheck className="w-8 h-8 mb-2" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Insured</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Truck className="w-8 h-8 mb-2" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Nationwide</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Clock className="w-8 h-8 mb-2" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">On Time</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Form Card */}
                    <div className="lg:w-1/2 w-full">
                        <div className="bg-white text-brand-dark rounded-3xl p-6 md:p-8 shadow-2xl relative">
                            <div className="absolute -top-4 -right-4 bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transform rotate-3">
                                FREE QUOTE
                            </div>

                            <h2 className="text-2xl font-bold mb-2 font-display">Get Your Instant Price</h2>
                            <p className="text-sm text-gray-500 mb-6">Enter your details below to receive a custom shipping quote.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Route */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Pickup City</label>
                                        <input
                                            name="pickupCity"
                                            value={form.pickupCity}
                                            onChange={handleChange}
                                            onBlur={handleCapitalizeBlur("pickupCity")}
                                            placeholder="City"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">State</label>
                                        <select
                                            name="pickupState"
                                            value={form.pickupState}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                            required
                                        >
                                            <option value="">State</option>
                                            {US_STATES.map((state) => (
                                                <option key={state.code} value={state.code}>
                                                    {state.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Delivery City</label>
                                        <input
                                            name="deliveryCity"
                                            value={form.deliveryCity}
                                            onChange={handleChange}
                                            onBlur={handleCapitalizeBlur("deliveryCity")}
                                            placeholder="City"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">State</label>
                                        <select
                                            name="deliveryState"
                                            value={form.deliveryState}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                            required
                                        >
                                            <option value="">State</option>
                                            {US_STATES.map((state) => (
                                                <option key={state.code} value={state.code}>
                                                    {state.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Vehicle */}
                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Vehicle Year, Make, Model</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            name="vehicleYear" value={form.vehicleYear} onChange={handleChange}
                                            placeholder="Year" className="col-span-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                        />
                                        <input
                                            name="vehicleMake" value={form.vehicleMake} onChange={handleChange} onBlur={handleCapitalizeBlur("vehicleMake")}
                                            placeholder="Make" className="col-span-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                        />
                                        <input
                                            name="vehicleModel" value={form.vehicleModel} onChange={handleChange} onBlur={handleCapitalizeBlur("vehicleModel")}
                                            placeholder="Model" className="col-span-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Transport Type</label>
                                        <select
                                            name="transportType"
                                            value={form.transportType}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                        >
                                            <option value="open">Open (Standard)</option>
                                            <option value="enclosed">Enclosed (Premium)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Condition</label>
                                        <select
                                            name="runningCondition"
                                            value={form.runningCondition}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none"
                                        >
                                            <option value="running">Running</option>
                                            <option value="non-running">Inoperable</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="pt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Contact Info</label>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                                name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleCapitalizeBlur("firstName")}
                                                placeholder="First Name" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                            />
                                            <input
                                                name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleCapitalizeBlur("lastName")}
                                                placeholder="Last Name" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                name="email" value={form.email} onChange={handleChange} type="email"
                                                placeholder="Email Address" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                            />
                                            <input
                                                name="phone" value={form.phone} onChange={handleChange} type="tel"
                                                placeholder="Phone Number" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red/50 outline-none" required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading || !isFormValid}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition active:scale-[0.98] 
                                        ${loading || !isFormValid ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-red text-white hover:bg-brand-redSoft shadow-brand-red/30"}
                                    `}
                                >
                                    {loading ? "Calculating..." : "Get My Free Quote"}
                                </button>

                                <p className="text-[10px] text-gray-400 text-center leading-tight">
                                    No credit card required. By clicking the button, you consent to receive a quote and related emails/texts.
                                </p>

                            </form>
                        </div>
                    </div>

                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="bg-white text-brand-dark py-16">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h2 className="text-3xl font-bold font-display mb-12">How It Works</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "1. Request a Quote", desc: "Fill out the simple form above to get pricing.", icon: "📝" },
                            { title: "2. We Assign a Carrier", desc: "We match you with a top-rated, insured driver.", icon: "🚚" },
                            { title: "3. Door-to-Door Delivery", desc: "Your vehicle is picked up and delivered safely.", icon: "🏡" },
                        ].map(step => (
                            <div key={step.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative">
                                <div className="text-4xl mb-4">{step.icon}</div>
                                <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="bg-brand-dark/50 py-16 text-white border-t border-white/5">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <h2 className="text-3xl font-bold font-display mb-10">What Our Customers Say</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { name: "Sarah J.", role: "Moved from CA to TX", text: "I was nervous about shipping my car for the first time, but Road America made it so easy. The driver was professional and my car arrived a day early!", stars: 5 },
                            { name: "Michael T.", role: "Bought a Car Online", text: "Great price and excellent communication. They kept me updated throughout the whole process. Highly recommend.", stars: 5 }
                        ].map((review, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left">
                                <div className="flex gap-1 mb-3 text-brand-red">
                                    {[...Array(review.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-white/80 text-sm mb-4">"{review.text}"</p>
                                <div>
                                    <p className="font-bold text-sm">{review.name}</p>
                                    <p className="text-xs text-white/50">{review.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="bg-white text-brand-dark py-16">
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="text-3xl font-bold font-display mb-8 text-center">Frequently Asked Questions</h2>

                    <div className="space-y-4">
                        {[
                            { q: "Is my vehicle insured during transport?", a: "Yes. Every carrier in our network is fully insured and vetted. Your vehicle is covered from pickup to delivery." },
                            { q: "Can I put personal items in the car?", a: "Carriers typically allow up to 100 lbs of personal items in the trunk or cargo area, but these items are not insured by the carrier." },
                            { q: "How long does shipping take?", a: "It depends on the distance. Coast-to-coast usually takes 7-10 days, while shorter trips (e.g. FL to NY) take 3-5 days." },
                        ].map((item, i) => (
                            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold list-none">
                                    <span>{item.q}</span>
                                    <span className="transition-transform group-open:rotate-180"><ChevronDown className="w-4 h-4" /></span>
                                </summary>
                                <div className="px-4 pb-4 text-sm text-gray-600">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="bg-brand-red py-12 text-white text-center">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="text-2xl font-bold mb-4">Ready to ship?</h2>
                    <p className="mb-6 opacity-90">Get your free, no-obligation quote today.</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-brand-red font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition">
                        Get My Quote Now
                    </button>
                </div>
            </section>

            {createdQuote && (
                <QuoteSuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleModalClose}
                    quote={createdQuote}
                />
            )}
        </div>
    );
}

export default LandingPage;
