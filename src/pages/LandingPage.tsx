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
import { ShieldCheck, Truck, Clock, CheckCircle2, Star, ChevronDown } from "lucide-react";

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
            <section className="relative pt-24 pb-12 overflow-hidden">
                {/* Background Element */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-[#1a1a1a] to-brand-red/10" />
                    {/* subtle grid */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    {/* Left Content */}
                    <div className="lg:w-1/2 pt-2 lg:pt-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5 text-xs font-bold text-brand-redSoft border border-brand-red/20 mb-6 backdrop-blur-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Rated 4.8/5 by 50,000+ Customers</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-4 tracking-tight">
                            America's Most Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Auto Transport</span>
                        </h1>

                        <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
                            Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                            <div className="flex items-center gap-2 text-white/90 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                                <ShieldCheck className="text-brand-redSoft w-4 h-4" />
                                <span className="text-sm font-medium">Fully Insured</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                                <Truck className="text-brand-redSoft w-4 h-4" />
                                <span className="text-sm font-medium">Door-to-Door</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                                <CheckCircle2 className="text-brand-redSoft w-4 h-4" />
                                <span className="text-sm font-medium">No Deposit</span>
                            </div>
                        </div>

                        {/* Trust Stats - Replaced Badges */}
                        <div className="grid grid-cols-3 gap-6 max-w-md border-t border-white/10 pt-6 opacity-80">
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">50k+</div>
                                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider font-semibold">Customers</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">15+</div>
                                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider font-semibold">Years Exp.</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">4.8</div>
                                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider font-semibold">Avg Rating</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form Card */}
                    <div className="lg:w-1/2 w-full lg:pl-12">
                        <div className="bg-white text-brand-dark rounded-2xl p-5 md:p-6 shadow-2xl relative shadow-brand-red/5">

                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-xl font-bold font-display text-gray-900">Get A Free Quote</h2>
                                    <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Step 1 of 1</span>
                                </div>
                                <p className="text-xs text-gray-500">Enter your details below to receive a custom shipping price instantly.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Route */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pickup City</label>
                                        <input
                                            name="pickupCity"
                                            value={form.pickupCity}
                                            onChange={handleChange}
                                            onBlur={handleCapitalizeBlur("pickupCity")}
                                            placeholder="City"
                                            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">State</label>
                                        <div className="relative">
                                            <select
                                                name="pickupState"
                                                value={form.pickupState}
                                                onChange={handleChange}
                                                className="w-full h-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                                required
                                            >
                                                <option value="">Select</option>
                                                {US_STATES.map((state) => (
                                                    <option key={state.code} value={state.code}>
                                                        {state.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivery City</label>
                                        <input
                                            name="deliveryCity"
                                            value={form.deliveryCity}
                                            onChange={handleChange}
                                            onBlur={handleCapitalizeBlur("deliveryCity")}
                                            placeholder="City"
                                            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">State</label>
                                        <div className="relative">
                                            <select
                                                name="deliveryState"
                                                value={form.deliveryState}
                                                onChange={handleChange}
                                                className="w-full h-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                                required
                                            >
                                                <option value="">Select</option>
                                                {US_STATES.map((state) => (
                                                    <option key={state.code} value={state.code}>
                                                        {state.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle */}
                                <div className="space-y-1 pt-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vehicle Year, Make, Model</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            name="vehicleYear" value={form.vehicleYear} onChange={handleChange}
                                            placeholder="Year" className="col-span-1 h-10 bg-gray-50 border border-gray-200 rounded-lg px-2 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                        />
                                        <input
                                            name="vehicleMake" value={form.vehicleMake} onChange={handleChange} onBlur={handleCapitalizeBlur("vehicleMake")}
                                            placeholder="Make" className="col-span-1 h-10 bg-gray-50 border border-gray-200 rounded-lg px-2 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                        />
                                        <input
                                            name="vehicleModel" value={form.vehicleModel} onChange={handleChange} onBlur={handleCapitalizeBlur("vehicleModel")}
                                            placeholder="Model" className="col-span-1 h-10 bg-gray-50 border border-gray-200 rounded-lg px-2 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Transport Type</label>
                                        <div className="relative">
                                            <select
                                                name="transportType"
                                                value={form.transportType}
                                                onChange={handleChange}
                                                className="w-full h-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                            >
                                                <option value="open">Open (Standard)</option>
                                                <option value="enclosed">Enclosed (Premium)</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Condition</label>
                                        <div className="relative">
                                            <select
                                                name="runningCondition"
                                                value={form.runningCondition}
                                                onChange={handleChange}
                                                className="w-full h-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium"
                                            >
                                                <option value="running">Running</option>
                                                <option value="non-running">Inoperable</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="pt-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact Info</label>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                                name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleCapitalizeBlur("firstName")}
                                                placeholder="First Name" className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                            />
                                            <input
                                                name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleCapitalizeBlur("lastName")}
                                                placeholder="Last Name" className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                name="email" value={form.email} onChange={handleChange} type="email"
                                                placeholder="Email Address" className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                            />
                                            <input
                                                name="phone" value={form.phone} onChange={handleChange} type="tel"
                                                placeholder="Phone Number" className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium" required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-xs text-red-500 text-center font-medium bg-red-50 py-2 rounded">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading || !isFormValid}
                                    className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transform transition-all duration-200 active:scale-[0.98] 
                                        ${loading || !isFormValid
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-brand-red text-white hover:bg-brand-redSoft shadow-brand-red/30 hover:shadow-brand-red/50"}
                                    `}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Calculating...
                                        </span>
                                    ) : "Get My Free Quote"}
                                </button>

                                <p className="text-[9px] text-gray-400 text-center leading-tight">
                                    No credit card required. By clicking the button, you consent to receive a quote and related emails/texts.
                                </p>

                                <div className="flex justify-center pt-2">
                                    <img
                                        src="/ase-logo.png"
                                        alt="ASE Master Technician"
                                        className="h-12 w-auto opacity-90 hover:opacity-100 transition-opacity"
                                    />
                                </div>

                            </form>
                        </div>
                    </div>

                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-[1px]">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[100px] text-white fill-current preserve-3d">
                        <path d="M0 120L1440 120L1440 0C1440 0 1082.5 99 720 99C357.5 99 0 0 0 0L0 120Z" />
                    </svg>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="bg-white text-brand-dark py-24 relative z-10">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 text-gray-900">How It Works</h2>
                    <p className="text-gray-500 mb-16 max-w-2xl mx-auto">Shipping your car shouldn't be complicated. We've simplified the process into three easy steps.</p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "1. Request a Quote", desc: "Fill out the simple form above to get pricing.", icon: "📝" },
                            { title: "2. We Assign a Carrier", desc: "We match you with a top-rated, insured driver.", icon: "🚚" },
                            { title: "3. Door-to-Door Delivery", desc: "Your vehicle is picked up and delivered safely.", icon: "🏡" },
                        ].map((step) => (
                            <div key={step.title} className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-brand-red/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-red/5 rounded-full blur-2xl group-hover:bg-brand-red/10 transition-colors"></div>
                                <div className="text-5xl mb-6 relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                                <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-brand-red transition-colors">{step.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="bg-[#121212] py-24 text-white border-t border-white/5 relative overflow-hidden">
                {/* Background decorators */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-12">What Our Customers Say</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { name: "Sarah J.", role: "Moved from CA to TX", text: "I was nervous about shipping my car for the first time, but Road America Auto Transport made it so easy. The driver was professional and my car arrived a day early!", stars: 5 },
                            { name: "Michael T.", role: "Bought a Car Online", text: "Great price and excellent communication. They kept me updated throughout the whole process. Highly recommend.", stars: 5 }
                        ].map((review, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-2xl text-left hover:bg-white/10 transition-colors duration-300">
                                <div className="flex gap-1 mb-4 text-brand-red">
                                    {[...Array(review.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-white/80 text-sm mb-6 leading-relaxed italic">"{review.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red font-bold text-xs uppercase">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{review.name}</p>
                                        <p className="text-xs text-white/40">{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="bg-white text-brand-dark py-24">
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="text-3xl font-bold font-display mb-4 text-center text-gray-900">Frequently Asked Questions</h2>
                    <p className="text-center text-gray-500 mb-12">Everything you need to know about the product and billing.</p>


                    <div className="space-y-4">
                        {[
                            { q: "Is my vehicle insured during transport?", a: "Yes. Every carrier in our network is fully insured and vetted. Your vehicle is covered from pickup to delivery against any carrier negligence." },
                            { q: "Can I put personal items in the car?", a: "Carriers typically allow up to 100 lbs of personal items in the trunk or cargo area at no extra charge. However, these items are not insured by the carrier, so we recommend not shipping valuables." },
                            { q: "How long does shipping take?", a: "It depends on the distance. Coast-to-coast usually takes 7-10 days, while shorter trips (e.g. FL to NY) take 3-5 days. Weather and traffic can also affect transit times." },
                        ].map((item, i) => (
                            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold list-none hover:bg-gray-100/50 transition-colors">
                                    <span className="text-gray-800">{item.q}</span>
                                    <span className="transition-transform duration-300 group-open:rotate-180 text-gray-400">
                                        <ChevronDown className="w-5 h-5" />
                                    </span>
                                </summary>
                                <div className="px-5 pb-5 pt-0 text-sm text-gray-600 leading-relaxed">
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
