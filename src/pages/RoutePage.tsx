import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { US_STATES } from "../services/states";
import QuoteSuccessModal from "../components/QuoteSuccessModal";
import { API_BASE_URL } from "../config/api";
import {
    createQuote,
    type QuoteCreated,
    type RunningCondition,
    type TransportType,
} from "../services/shipmentsService";
import {
    ShieldCheck,
    Truck,
    Clock,
    CheckCircle2,
    Star,
    ChevronDown,
    MapPin,
    Navigation,
    Calendar,
    DollarSign,
    ArrowRight,
    HelpCircle
} from "lucide-react";
import SEO from "../components/SEO";
import { trackConversion } from "../lib/analytics";
import VehicleSelector from "../components/VehicleSelector";
import { getRouteBySlug, ROUTES_DATA, type RouteConfig } from "../data/routesData";

export type QuoteFormState = {
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

interface RoutePageProps {
    routeId?: string;
}

export default function RoutePage({ routeId }: RoutePageProps) {
    const params = useParams<{ slug?: string }>();
    const activeSlug = routeId || params.slug || "";
    const route = getRouteBySlug(activeSlug);

    const [form, setForm] = useState<QuoteFormState>({
        ...defaultForm,
        pickupCity: route?.fromCity || "",
        pickupState: route?.fromState || "",
        deliveryCity: route?.toCity || "",
        deliveryState: route?.toState || "",
    });
    const [loading, setLoading] = useState(false);
    const [createdQuote, setCreatedQuote] = useState<QuoteCreated | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (route) {
            setForm((prev) => ({
                ...prev,
                pickupCity: route.fromCity,
                pickupState: route.fromState,
                deliveryCity: route.toCity,
                deliveryState: route.toState,
            }));
        }
    }, [route]);

    if (!route) {
        return (
            <div className="bg-brand-dark min-h-screen text-white pt-32 pb-20 px-4 text-center">
                <div className="max-w-md mx-auto bg-white/5 p-8 rounded-2xl border border-white/10">
                    <h1 className="text-3xl font-bold font-display mb-4">Route Not Found</h1>
                    <p className="text-white/70 mb-6 text-sm">
                        We couldn't find the specific route page you were looking for. Explore our full route index below.
                    </p>
                    <Link
                        to="/car-shipping-routes"
                        className="inline-block bg-brand-red text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-redSoft transition"
                    >
                        Browse All Car Shipping Routes
                    </Link>
                </div>
            </div>
        );
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleModalClose() {
        setShowSuccessModal(false);
        setCreatedQuote(null);
        setForm({
            ...defaultForm,
            pickupCity: route!.fromCity,
            pickupState: route!.fromState,
            deliveryCity: route!.toCity,
            deliveryState: route!.toState,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCapitalizeBlur(field: keyof QuoteFormState) {
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

            const normalizedYear = /^\d{4}$/.test(form.vehicleYear) ? form.vehicleYear : undefined;

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
                runningCondition: form.runningCondition,
                transportType: form.transportType,
                preferredPickupWindow: form.preferredPickupWindow,
                vehicleHeightMod: form.vehicleHeightMod,
                captchaToken,
            });

            setCreatedQuote(created);
            setShowSuccessModal(true);

            trackConversion("AW-857831655/JjC4CNf4z5YaEKe6x5iD");

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

    const isFormValid = requiredValues.every((v) => String(v ?? "").trim() !== "");

    const canonicalPath = `/car-shipping-routes/${route.slug}`;
    const fullCanonicalUrl = `https://roadamericacars.com${canonicalPath}`;

    // Schema definitions
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": route.faqContent.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
            },
        })),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://roadamericacars.com/",
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Car Shipping Routes",
                "item": "https://roadamericacars.com/car-shipping-routes",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": `${route.fromCity} to ${route.toCity} Car Shipping`,
                "item": fullCanonicalUrl,
            },
        ],
    };

    const relatedRoutes = route.relatedRouteSlugs
        .map((s) => ROUTES_DATA[s])
        .filter((r): r is RouteConfig => Boolean(r));

    return (
        <div className="bg-brand-dark min-h-screen text-white">
            <SEO
                title={route.seoTitle}
                description={route.seoDescription}
                canonical={canonicalPath}
                keywords={[
                    `car shipping ${route.fromCity} to ${route.toCity}`,
                    `auto transport ${route.fromCity} to ${route.toCity}`,
                    `ship car ${route.fromCity} ${route.fromState} to ${route.toCity} ${route.toState}`,
                    `car shipping price ${route.fromCity} to ${route.toCity}`,
                    "door to door auto transport",
                ]}
            />

            {/* JSON-LD Structured Data */}
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            {/* HERO SECTION */}
            <section className="relative pt-24 pb-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-[#3a3a3a] to-brand-red/10" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    {/* Left Content */}
                    <div className="lg:w-1/2 pt-2 lg:pt-8">
                        {/* Breadcrumbs Nav */}
                        <nav className="flex items-center gap-2 text-xs text-white/60 mb-4" aria-label="Breadcrumb">
                            <Link to="/" className="hover:text-white transition">Home</Link>
                            <span>/</span>
                            <Link to="/car-shipping-routes" className="hover:text-white transition">Routes</Link>
                            <span>/</span>
                            <span className="text-brand-redSoft font-medium">{route.fromCity} to {route.toCity}</span>
                        </nav>

                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5 text-xs font-bold text-brand-redSoft border border-brand-red/20 mb-6 backdrop-blur-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Rated 5/5 by 50,000+ Customers</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-4 tracking-tight">
                            {route.h1Title}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">
                                {route.h1Subtitle || "Car Shipping"}
                            </span>
                        </h1>

                        <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
                            {route.introductoryCopy}
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

                        {/* Route Overview Quick Badge Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl max-w-xl mb-6 backdrop-blur-sm">
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-white/50 block">Distance</span>
                                <span className="text-sm font-bold text-white flex items-center gap-1">
                                    <Navigation className="w-3.5 h-3.5 text-brand-redSoft" />
                                    {route.approximateDistance}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-white/50 block">Est. Transit</span>
                                <span className="text-sm font-bold text-white flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-brand-redSoft" />
                                    {route.estimatedTransitTime}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-white/50 block">Service</span>
                                <span className="text-sm font-bold text-white flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-brand-redSoft" />
                                    Door-to-Door
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-white/50 block">Coverage</span>
                                <span className="text-sm font-bold text-white flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-brand-redSoft" />
                                    Full Cargo
                                </span>
                            </div>
                        </div>

                        {/* Trust Stats */}
                        <div className="grid grid-cols-3 gap-6 max-w-md border-t border-white/10 pt-6 opacity-80">
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">10k+</div>
                                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider font-semibold">Customers</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">15+</div>
                                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider font-semibold">Years Exp.</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold font-display text-white">5</div>
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
                                    <VehicleSelector
                                        year={form.vehicleYear}
                                        make={form.vehicleMake}
                                        model={form.vehicleModel}
                                        onChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
                                        className="mb-1"
                                    />
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
                                    ) : `Get ${route.fromCity} to ${route.toCity} Quote`}
                                </button>

                                <p className="text-[9px] text-gray-400 text-center leading-tight">
                                    No credit card required. Hand-calculated quotes by ASE Master Techs delivered directly to your inbox. No high-pressure calls or spam.
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

            {/* ROUTE DEEP DIVE & SEO GUIDE SECTION */}
            <section className="bg-white text-gray-900 py-16">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-3">
                            {route.fromCity} to {route.toCity} Car Shipping Guide
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Everything you need to know about transporting your car between {route.fromCity}, {route.fromState} and {route.toCity}, {route.toState}.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Major Pickup Areas */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-brand-red">
                                <MapPin className="w-6 h-6" />
                                <h3 className="text-xl font-bold text-gray-900">
                                    Major {route.fromCity} Pickup Areas
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Our haulers offer complete door-to-door pickup across all major neighborhoods and surrounding communities in {route.fromCity}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {route.majorPickupAreas.map((area, idx) => (
                                    <span key={idx} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Major Delivery Areas */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-brand-red">
                                <MapPin className="w-6 h-6" />
                                <h3 className="text-xl font-bold text-gray-900">
                                    Major {route.toCity} Delivery Hubs
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                We safely deliver your vehicle directly to residential or commercial addresses throughout the {route.toCity} region:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {route.majorDeliveryAreas.map((area, idx) => (
                                    <span key={idx} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Route Pricing Factors & Seasonal Insights */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Pricing Factors */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-brand-red">
                                <DollarSign className="w-6 h-6" />
                                <h3 className="text-xl font-bold text-gray-900">Route Pricing Factors</h3>
                            </div>
                            <ul className="space-y-3">
                                {route.routeSpecificPricingFactors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                                        <span>{factor}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Seasonal Considerations */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-brand-red">
                                <Calendar className="w-6 h-6" />
                                <h3 className="text-xl font-bold text-gray-900">Seasonal Considerations</h3>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {route.seasonalConsiderations}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="bg-gray-50 text-brand-dark py-20 border-t border-gray-200">
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
            <section className="bg-[#323232] py-20 text-white border-t border-white/5 relative overflow-hidden">
                <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-12">What Our Customers Say</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                name: "Sarah J.",
                                role: `Moved from ${route.fromCity} to ${route.toCity}`,
                                text: `I was nervous about shipping my car from ${route.fromCity} for the first time, but Road America Auto Transport made it so easy. The driver was professional and my vehicle arrived on schedule!`,
                                stars: 5,
                            },
                            {
                                name: "Michael T.",
                                role: `Shipped vehicle on ${route.fromCity} to ${route.toCity} route`,
                                text: "Great price and excellent communication. They kept me updated throughout the whole process. Highly recommend.",
                                stars: 5,
                            },
                        ].map((review, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-2xl text-left hover:bg-white/10 transition-colors duration-300">
                                <div className="flex gap-1 mb-4 text-brand-red">
                                    {[...Array(review.stars)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-current" />
                                    ))}
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

            {/* ROUTE SPECIFIC FAQ SECTION */}
            <section className="bg-white text-brand-dark py-20">
                <div className="mx-auto max-w-3xl px-4">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold text-brand-red mb-3">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Route FAQ</span>
                        </div>
                        <h2 className="text-3xl font-bold font-display text-gray-900">
                            {route.fromCity} to {route.toCity} FAQs
                        </h2>
                        <p className="text-gray-500 text-sm mt-2">
                            Common questions about shipping a car from {route.fromCity}, {route.fromState} to {route.toCity}, {route.toState}.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {route.faqContent.map((item, i) => (
                            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold list-none hover:bg-gray-100/60 transition-colors">
                                    <span className="text-gray-900">{item.question}</span>
                                    <span className="transition-transform duration-300 group-open:rotate-180 text-gray-400">
                                        <ChevronDown className="w-5 h-5" />
                                    </span>
                                </summary>
                                <div className="px-5 pb-5 pt-0 text-sm text-gray-600 leading-relaxed">
                                    {item.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* RELATED ROUTES SECTION */}
            {relatedRoutes.length > 0 && (
                <section className="bg-gray-50 py-16 border-t border-gray-200 text-gray-900">
                    <div className="mx-auto max-w-6xl px-4">
                        <h3 className="text-2xl font-bold font-display text-center mb-8">
                            Related Car Shipping Routes
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {relatedRoutes.map((relRoute) => (
                                <Link
                                    key={relRoute.id}
                                    to={`/car-shipping-routes/${relRoute.slug}`}
                                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:shadow-md hover:border-brand-red/40 transition group"
                                >
                                    <div className="flex items-center justify-between text-xs font-semibold text-brand-red mb-2">
                                        <span>{relRoute.approximateDistance}</span>
                                        <span>{relRoute.estimatedTransitTime}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-brand-red transition flex items-center justify-between">
                                        <span>{relRoute.fromCity} to {relRoute.toCity}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                        {relRoute.seoDescription}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FINAL CTA */}
            <section className="bg-brand-red py-12 text-white text-center">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                        Ready to ship your car from {route.fromCity} to {route.toCity}?
                    </h2>
                    <p className="mb-6 opacity-90 text-sm md:text-base">
                        Get your free, no-obligation instant auto transport quote today.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="bg-white text-brand-red font-bold py-3.5 px-8 rounded-full shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-0.5"
                    >
                        Get My Free Quote Now
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
