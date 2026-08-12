// src/pages/TruthAboutAutoTransportPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  PhoneCall,
  UserCheck,
  Clock,
  DollarSign,
  MapPin,
  FileCheck,
  AlertTriangle,
  Building2,
  Users,
  Award,
  Lock,
  ArrowRight,
  ChevronRight,
  HeartHandshake,
  Navigation,
  Sparkles,
  Phone,
  MessageCircle,
  Car,
  Fuel,
  Shield,
  Layers,
  Check
} from "lucide-react";
import SEO from "../components/SEO";

// Section 1: Hero Section Component
function HeroSection() {
  const [activeTab, setActiveTab] = useState<"industry" | "roadamerica">("roadamerica");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#36383d] via-brand-dark to-[#2e2f32] py-16 md:py-24 border-b border-white/10">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-redSoft via-brand-red/20 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-redSoft backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Educational Guide & Digital Brochure
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]">
              Auto Transport Shouldn’t Feel Like a{" "}
              <span className="bg-gradient-to-r from-brand-redSoft via-red-400 to-amber-300 bg-clip-text text-transparent">
                Gamble.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl font-light">
              Shipping a vehicle can be stressful. Customers see hundreds of companies claiming to be the cheapest, fastest, and most reliable. Road America helps customers understand the process, avoid common industry problems, and ship with confidence.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/quote"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition-all duration-300 hover:bg-brand-redSoft hover:shadow-brand-red/50 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                Get a Free Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <a
                href="#industry-truth"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 text-center"
              >
                See How Auto Transport Works
              </a>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 text-xs sm:text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>Licensed & Bonded Broker</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>Zero Lead Reselling</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>25+ Yrs Fleet Expertise</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Side-by-Side Comparison */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-[#34363b]/90 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Visual Comparison
                </span>
                <div className="flex rounded-full bg-black/25 p-1 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("industry")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeTab === "industry"
                        ? "bg-red-500/30 text-red-300 font-semibold"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    The Chaos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("roadamerica")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeTab === "roadamerica"
                        ? "bg-emerald-500/30 text-emerald-300 font-semibold"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Road America
                  </button>
                </div>
              </div>

              {activeTab === "industry" ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200">
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Lowball Bait Quote</h4>
                      <p className="text-xs text-red-300/80">Quoted $500 below market to lock in booking</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Phone Spam Notification</span>
                      <span className="text-red-400 font-mono">18 Missed Calls</span>
                    </div>
                    <p className="text-xs text-white/80 italic">
                      "Data sold to 15 different brokers simultaneously..."
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/70">Carrier Status</span>
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 font-medium">
                      No Driver Assigned
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/20 text-xs text-red-300">
                    ⚠️ Day 7: Broker calls demanding $450 extra or vehicle stays stranded.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Realistic Market Pricing</h4>
                      <p className="text-xs text-emerald-300/80">Calculated based on real driver route economics</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Privacy Shield</span>
                      <span className="text-emerald-400 font-semibold">1-on-1 Contact Only</span>
                    </div>
                    <p className="text-xs text-white/80">
                      Direct line with a dedicated transport coordinator. Zero spam.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/70">Vetted Carrier Status</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Assigned & Insured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Active monitoring from dispatch to final delivery signature.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 2: Introductory Trust Section Component
function TrustSection() {
  return (
    <section id="industry-truth" className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Industry Transparency
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Before You Choose a Transport Company, You Should Know How the Industry Really Works.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Most people assume the company they hire owns the truck that will transport their vehicle. In most cases, that is not how the industry works.
          </p>
        </div>

        {/* Copy & Explanation */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-white/20 transition">
            <div className="h-10 w-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-redSoft mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Licensed Brokers & Carriers</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Most auto transport companies are licensed brokers. Brokers connect customers with independent, licensed motor carriers that own and operate the trucks.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-white/20 transition">
            <div className="h-10 w-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-redSoft mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">The Broker’s Responsibility</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The broker’s job is to understand the shipment, provide realistic pricing, locate the right carrier, verify credentials and insurance, coordinate pickup, monitor the shipment, communicate, and help resolve problems.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-white/20 transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Simple vs. Stressful</h3>
              <p className="text-sm text-emerald-300 font-medium mb-2">
                ✓ A good broker makes the process simple.
              </p>
              <p className="text-sm text-red-300 font-medium">
                ✗ A bad broker leaves the customer chasing answers.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Diagram: Step Flowchart */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-black/40 via-[#383a40] to-black/40 p-6 md:p-10 shadow-2xl">
          <h3 className="text-center text-xs uppercase tracking-widest font-bold text-white/50 mb-8">
            How Road America Connects You To Your Carrier
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="h-12 w-12 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-redSoft font-bold mb-3 border border-brand-red/30">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Customer</h4>
              <p className="text-xs text-white/60 mt-1">Requests quote & options</p>
            </div>

            <div className="hidden md:flex justify-center text-brand-redSoft">
              <ChevronRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-brand-red/20 border border-brand-red/40 relative">
              <div className="h-12 w-12 rounded-full bg-brand-red flex items-center justify-center text-white font-bold mb-3 shadow-lg shadow-brand-red/50">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Road America</h4>
              <p className="text-xs text-white/80 mt-1">Verifies route & market</p>
            </div>

            <div className="hidden md:flex justify-center text-brand-redSoft">
              <ChevronRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold mb-3 border border-white/20">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Vetted Motor Carrier</h4>
              <p className="text-xs text-white/60 mt-1">Insured & verified transport</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Result: Safe, door-to-door vehicle delivery with continuous updates.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 3: "What Happens After You Request a Quote?" Section
function QuoteProcessSection() {
  const steps = [
    { num: "01", title: "Shipment Details Submitted", desc: "Customer submits route, vehicle type, and preferred timing online or by phone." },
    { num: "02", title: "Route & Market Analysis", desc: "Road America reviews the route, vehicle size, current fuel index, and seasonality." },
    { num: "03", title: "Honest Market Estimate", desc: "We provide a realistic transportation estimate based on active carrier rates." },
    { num: "04", title: "Offered to Qualified Network", desc: "The shipment is dispatched to vetted, licensed carriers specializing in that corridor." },
    { num: "05", title: "Carrier Schedule Review", desc: "Carriers evaluate their trailer space, route timing, and driver hours." },
    { num: "06", title: "Authority & Insurance Check", desc: "Road America verifies active DOT authority and required cargo insurance before assignment." },
    { num: "07", title: "Pickup Coordination", desc: "Pickup date and driver contact details are confirmed with customer and carrier." },
    { num: "08", title: "Shipment Monitoring", desc: "Proactive tracking and updates are maintained throughout transit to delivery." },
    { num: "09", title: "Delivery & Follow-Up", desc: "Vehicle is inspected, handed over, signed for, and completion is confirmed." },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            End-to-End Stewardship
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            What Happens After You Request a Quote?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            We do much more than simply post a vehicle to a board and walk away. Here is our step-by-step process:
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-2xl border border-white/10 bg-[#36383e] p-6 transition-all duration-300 hover:border-brand-red/40 hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-brand-redSoft group-hover:text-red-400 transition-colors">
                  {step.num}
                </span>
                <div className="h-2 w-2 rounded-full bg-brand-redSoft" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 4: "How Carriers Actually Choose Loads" Section
function CarrierRouteSection() {
  const routeFactors = [
    { icon: MapPin, title: "Pickup & Delivery Locations", desc: "City center vs. rural access" },
    { icon: Navigation, title: "Miles Between Stops", desc: "Efficient route sequencing" },
    { icon: Fuel, title: "Fuel Costs", desc: "Diesel pricing variations" },
    { icon: Car, title: "Vehicle Size & Weight", desc: "SUV/Truck space vs. sedan" },
    { icon: Layers, title: "Trailer Capacity", desc: "Space remaining on 9-car haulers" },
    { icon: Clock, title: "Schedule Flexibility", desc: "Window of pickup availability" },
    { icon: Sparkles, title: "Seasonal Demand", desc: "Snowbird season & lane volume" },
    { icon: Truck, title: "Return Loads", desc: "Backhaul availability" },
    { icon: DollarSign, title: "Route Profitability", desc: "Driver ELD hours & tolls" },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
              Route Mechanics
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Carriers Don’t Just Choose Vehicles. They Build Routes.
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
              A carrier may decline a shipment even when the vehicle is ready because the route does not fit the rest of the truck’s schedule. That is why accurate pricing, realistic expectations, and route knowledge matter.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {routeFactors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <factor.icon className="w-4 h-4 text-brand-redSoft mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{factor.title}</h4>
                    <p className="text-[11px] text-white/50">{factor.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Map Graphic */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#383a40] to-black p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-redSoft" />
                Sample Interstate Carrier Corridor
              </h3>

              <div className="relative pl-6 border-l-2 border-brand-red/50 space-y-6">
                {[
                  { city: "Miami, FL", note: "Origin load loaded on trailer" },
                  { city: "Orlando, FL", note: "Add 2 vehicles from dealer auction" },
                  { city: "Atlanta, GA", note: "Drop 1 sedan, pick up 1 SUV" },
                  { city: "Charlotte, NC", note: "Rest stop & fuel compliance check" },
                  { city: "Baltimore, MD", note: "Final delivery destination" },
                ].map((stop, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-brand-red border-2 border-black" />
                    <h4 className="text-sm font-bold text-white">{stop.city}</h4>
                    <p className="text-xs text-white/60">{stop.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-xs text-white/80">
                <span className="font-semibold text-brand-redSoft">Key Takeaway:</span> Road America understands driver routes so your quote matches actual carrier schedules.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 5: "Why the Lowest Quote Often Fails" Section
function LowQuoteFailsSection() {
  const timelineDays = [
    { day: "Day 1", title: "Customer Accepts Low Quote", desc: "Quoted $500 to win booking ($400 under market rate).", status: "bad" },
    { day: "Day 3", title: "No Carrier Accepts", desc: "Independent drivers ignore the underpriced listing.", status: "bad" },
    { day: "Day 5", title: "Pickup Approaching", desc: "No driver assigned. Broker promises 'working on it'.", status: "bad" },
    { day: "Day 7", title: "Price Bump Request", desc: "Broker demands +$500 extra to get a driver.", status: "bad" },
    { day: "Day 8", title: "Customer Trapped", desc: "Flight leaves tomorrow; forced to pay unexpected increase.", status: "bad" },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Avoiding the Bait & Switch
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            The Lowest Quote Is Not Always the Lowest Final Price.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Some companies quote far below market price just to secure the booking. The customer later learns that no carrier is willing to accept the shipment at that artificial price.
          </p>
        </div>

        {/* Timeline Graphic */}
        <div className="grid gap-4 sm:grid-cols-5 mb-12">
          {timelineDays.map((t, idx) => (
            <div key={idx} className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 relative">
              <div className="text-xs font-mono font-bold text-red-400 mb-1">{t.day}</div>
              <h3 className="text-xs font-bold text-white mb-1">{t.title}</h3>
              <p className="text-[11px] text-white/60 leading-tight">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-md">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Road America’s Pricing Ethics</h3>
              <p className="text-sm text-white/70 leading-relaxed font-light">
                Road America does not intentionally use unrealistic pricing to win business. Our goal is to provide a competitive and honest estimate based on current market conditions.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Important Disclaimer:
              </div>
              <p className="leading-relaxed">
                Pricing may still change if shipment details, timing, route conditions, vehicle condition, or market demand change. We do not promise that every quote is permanently guaranteed unless part of a specific written agreement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 6: Lead-Selling and Privacy Section
function PrivacySection() {
  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
              Spam-Free Privacy Guarantee
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              One Quote Request Should Not Trigger Twenty Phone Calls.
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
              Some online quote websites are not transport companies. Their business model is collecting customer phone numbers and selling them as "leads" to dozens of competing brokers.
            </p>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
              That is why customers sometimes receive dozens of calls, texts, and high-pressure emails within minutes of requesting a single quote online.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Road America Privacy Promise
              </h3>
              <p className="text-xs sm:text-sm text-emerald-300/90 mt-1">
                Road America does not sell customer information. When you request a quote from Road America, you communicate directly with us—period.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="grid gap-6">
              {/* Lead Gen Website Flow */}
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3">
                  Typical Lead-Aggregator Website
                </div>
                <div className="text-xs text-white/70 space-y-2">
                  <p className="font-medium text-white">Customer Form Submission</p>
                  <p className="text-red-300">↓ Sold to 10 - 25 Third-Party Brokers</p>
                  <p className="text-red-400 font-mono">→ 30+ Calls, Constant Spam Texts & Aggressive Pressure</p>
                </div>
              </div>

              {/* Road America Direct Flow */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                  Road America Auto Transport Direct
                </div>
                <div className="text-xs text-white/80 space-y-2">
                  <p className="font-medium text-white">Customer Form Submission</p>
                  <p className="text-emerald-300">↓ Direct Secure Communication With Road America</p>
                  <p className="text-emerald-400 font-semibold">→ 1 Dedicated Transport Coordinator. Zero Spam.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 7: Typical Industry Experience vs. Road America Section
function ComparisonSection() {
  const comparisonItems = [
    { feature: "Quote Strategy", typical: "Artificially low to win initial booking", ra: "Realistic, market-informed pricing" },
    { feature: "Data Privacy", typical: "Information often sold or shared to third parties", ra: "Customer information is never sold" },
    { feature: "Contact Model", typical: "Multiple aggressive salespeople calling", ra: "A dedicated single point of contact" },
    { feature: "Expectation Setting", typical: "Vague promises and hidden fees", ra: "Clear expectations set before booking" },
    { feature: "Carrier Vetting", typical: "Selected mainly based on cheapest availability", ra: "Rigorous authority & insurance verification" },
    { feature: "Logistics Coordination", typical: "Customer left to coordinate with driver", ra: "Complete pickup and delivery coordination" },
    { feature: "Post-Dispatch", typical: "Involvement drops after deposit is taken", ra: "Proactive shipment monitoring throughout" },
    { feature: "Final Delivery", typical: "Customer must repeatedly chase updates", ra: "Full support through final delivery sign-off" },
    { feature: "Core Focus", typical: "High-volume transactional booking", ra: "Long-term relationships and trust" },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Side-by-Side Comparison
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Typical Industry Experience vs. Road America
          </h2>
        </div>

        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-[#36383e] shadow-2xl">
          <table className="w-full text-left text-sm text-white">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="py-4 px-6">Feature / Touchpoint</th>
                <th className="py-4 px-6 text-red-400">Typical Experience</th>
                <th className="py-4 px-6 text-emerald-400 bg-emerald-950/20">Road America Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
              {comparisonItems.map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="py-4 px-6 font-semibold text-white/90">{item.feature}</td>
                  <td className="py-4 px-6 text-white/60">{item.typical}</td>
                  <td className="py-4 px-6 font-semibold text-emerald-300 bg-emerald-950/10">
                    ✓ {item.ra}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden space-y-4">
          {comparisonItems.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#36383e] p-5 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">{item.feature}</h3>
              <div className="text-xs text-red-300">
                <span className="font-semibold block text-red-400">Typical:</span> {item.typical}
              </div>
              <div className="text-xs text-emerald-300 font-medium">
                <span className="font-semibold block text-emerald-400">Road America:</span> ✓ {item.ra}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 8: The Road America Service Standard
function ServiceStandardSection() {
  const standards = [
    { title: "Honest Pricing", desc: "We explain what affects price and avoid underpricing just to win bookings.", icon: DollarSign },
    { title: "Dedicated Support", desc: "Customers have a real point of contact before, during, and after transport.", icon: Users },
    { title: "Carrier Verification", desc: "We verify active operating authority and required insurance before assignment.", icon: ShieldCheck },
    { title: "Shipment Monitoring", desc: "Our job does not end when a carrier accepts the load. We stay involved through delivery.", icon: Clock },
    { title: "Privacy First", desc: "We do not sell customer information. Your data remains private with us.", icon: Lock },
    { title: "No Credit Card Required", desc: "Learn about pricing options without immediately providing payment information.", icon: FileCheck },
    { title: "Clear Communication", desc: "When weather or delays happen, we communicate honestly rather than disappear.", icon: PhoneCall },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Our Commitment
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            The Road America Service Standard
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {standards.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-brand-red/40 transition">
              <div className="h-10 w-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-redSoft mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 9: "What You Are Really Paying For" Section
function WhatYouPayForSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Value Breakdown
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            What You Are Really Paying For
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Understanding how your payment is allocated between carrier transportation costs and broker coordination services.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Carrier Portion */}
          <div className="rounded-3xl border border-white/10 bg-[#36383e] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-redSoft font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Carrier Transportation Portion</h3>
                <p className="text-xs text-white/50">Covers direct truck operations & equipment</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-white/80">
              {[
                "Commercial driver compensation",
                "Diesel fuel & highway tolls",
                "Commercial cargo & liability insurance",
                "Truck and multi-car trailer lease/financing",
                "Rig maintenance & safety inspections",
                "ELD DOT compliance & route operation",
                "Specialized vehicle handling (winching, enclosed ramps)",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Broker Portion */}
          <div className="rounded-3xl border border-white/10 bg-[#36383e] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Road America Service & Stewardship</h3>
                <p className="text-xs text-white/50">Covers coordination, verification & support</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-white/80">
              {[
                "Pricing and route market analysis",
                "Qualified carrier search & negotiation",
                "Active DOT authority & insurance verification",
                "Pickup & delivery window scheduling",
                "Proactive customer communication & updates",
                "Transit tracking & dispatch monitoring",
                "Documentation & final delivery confirmation",
                "Problem resolution & carrier accountability",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 10: Founder Story Component
function FounderStorySection() {
  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#383a40] via-black to-[#323438] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left: Profile Card & ASE Badge */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-brand-red/40 bg-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                  <img
                    src="/amilcar-charles.jpg"
                    alt="Amilcar Charles - Founder, Road America Auto Transport"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <img
                  src="/ase-logo.png"
                  alt="ASE Certified Master Tech"
                  className="absolute bottom-0 right-0 h-10 w-auto bg-white p-1 rounded-md shadow-md"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Amilcar Charles</h3>
              <p className="text-xs text-brand-redSoft font-semibold uppercase tracking-wider mt-1">
                Founder, Road America Auto Transport
              </p>
              <p className="text-xs text-white/50 mt-1">ASE Master Certified • Fleet Specialist</p>
            </div>

            {/* Right: Bio & Quote */}
            <div className="lg:col-span-8 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
                Leadership & Experience
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Built on More Than 25 Years of Fleet and Automotive Experience.
              </h2>

              <p className="text-sm text-white/80 leading-relaxed font-light">
                Road America Auto Transport was founded by Amilcar Charles, an automotive and fleet management professional with more than 25 years of experience.
              </p>
              <p className="text-sm text-white/80 leading-relaxed font-light">
                Throughout his career, Amilcar worked in vehicle maintenance, fleet operations, customer experience, vendor management, process improvement, and enterprise fleet support. He has supported large commercial fleets and worked with organizations responsible for hundreds of thousands of vehicles across North America.
              </p>
              <p className="text-sm text-white/80 leading-relaxed font-light">
                Road America was created to bring the same level of communication, accountability, operational discipline, and customer care used by large corporate fleets to individuals, families, dealerships, and businesses shipping vehicles.
              </p>

              <blockquote className="p-6 rounded-2xl border-l-4 border-brand-redSoft bg-white/5 italic text-sm text-white/90">
                “Customers should not need to understand the entire transportation industry to receive honest service. Our job is to guide them, protect their interests, and keep them informed.”
                <span className="block mt-2 not-italic font-bold text-xs text-brand-redSoft">
                  — Amilcar Charles
                </span>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 11: Every Shipment Has a Story Section
function ShipmentStorySection() {
  const stories = [
    { title: "Family Relocation", desc: "Moving to a new state with peace of mind." },
    { title: "College Students", desc: "Safely sending cars off to campus." },
    { title: "Military Moves (PCS)", desc: "Relocating active duty service members." },
    { title: "Online Vehicle Purchases", desc: "Shipping cars bought across state lines." },
    { title: "Dealership Transfers", desc: "Dealer-to-dealer inventory transport." },
    { title: "Corporate Fleet Moves", desc: "Moving company vehicles efficiently." },
    { title: "Classic & Collector Shipping", desc: "Enclosed transport for high-value cars." },
    { title: "Caribbean & Island Transport", desc: "Port coordination for island shipments." },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            More Than Metal & Wheels
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            We Know It Is More Than Just a Vehicle.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Every shipment represents a move, a purchase, an opportunity, a memory, or an important life event. That is why communication and accountability matter.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#36383e] p-6 hover:border-brand-red/40 transition">
              <div className="h-8 w-8 rounded-lg bg-brand-red/20 text-brand-redSoft flex items-center justify-center mb-3">
                <Car className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 12: Business and Dealer Services
function BusinessServicesSection() {
  const b2bServices = [
    "Dealership vehicle transfers",
    "Auction purchases (Manheim, Copart, IAAI)",
    "Fleet relocations & employee moves",
    "Multi-vehicle batch transportation",
    "Seasonal fleet transportation",
    "Port freight forwarders & Caribbean shipping",
    "Recurring commercial transport contracts",
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#34363b] via-[#3c3e44] to-[#34363b] p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
                B2B & Dealer Networking
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Business & Commercial Transportation Services
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-light">
                Scanning this QR code at an industry conference or business event? Road America provides enterprise-grade fleet coordination for commercial partners.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                {b2bServices.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 text-center p-6 rounded-2xl bg-black/20 border border-white/10 space-y-4">
              <Building2 className="w-10 h-10 text-brand-redSoft mx-auto" />
              <h3 className="text-lg font-bold text-white">Need a Commercial Partner?</h3>
              <p className="text-xs text-white/60">
                Speak directly with our founder and commercial team regarding volume dispatch and recurring logistics needs.
              </p>
              <Link
                to="/quote"
                className="inline-block w-full rounded-full bg-brand-red px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-brand-redSoft transition"
              >
                Talk to Road America Commercial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 13: Our Promise Component
function PromiseSection() {
  const promises = [
    "We will not intentionally quote a price we know is unlikely to move your vehicle.",
    "We will not sell your personal information.",
    "We will not disappear after your shipment is booked.",
    "We will verify the carrier’s operating authority and insurance before assignment.",
    "We will communicate honestly, even when the news is not perfect.",
    "We will treat your vehicle with the same level of care we expect for our own families.",
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-brand-red/40 bg-gradient-to-b from-[#383a40] to-[#2f3033] p-8 sm:p-14 text-center shadow-2xl relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-redSoft mb-6">
            <Award className="w-4 h-4" />
            Official Pledge
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-8">
            The Road America Promise
          </h2>

          <div className="grid gap-4 md:grid-cols-2 text-left mb-10">
            {promises.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/90 leading-relaxed">{p}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col items-center">
            <p className="text-sm font-bold text-white">Amilcar Charles</p>
            <p className="text-xs text-brand-redSoft font-semibold">Founder, Road America Auto Transport</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 14: Final Call to Action & Legal Disclaimers
function FinalCTASection() {
  return (
    <section className="py-16 md:py-24 bg-[#2e2f32] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Ship With Confidence.
          </h2>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Whether you are moving one vehicle or managing recurring transportation needs, Road America is ready to help you understand your options and coordinate the right solution.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/quote"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-brand-red px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-brand-redSoft transition-all hover:-translate-y-0.5"
            >
              Get a Free Quote
            </Link>
            <a
              href="tel:17546005772"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Road America
            </a>
            <a
              href="https://wa.me/17546005772"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/40 px-7 py-4 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Us on WhatsApp
            </a>
          </div>
        </div>

        {/* Operational & Legal Disclaimers */}
        <div className="mt-16 pt-8 border-t border-white/10 text-xs text-white/50 space-y-3 font-light leading-relaxed max-w-5xl mx-auto">
          <p className="font-semibold text-white/70">Legal & Operational Disclaimers:</p>
          <p>
            • Road America Auto Transport is a licensed and bonded auto transport broker. Road America does not own or operate the trucks, nor are motor carrier drivers employees of Road America.
          </p>
          <p>
            • Vehicle transit coverage is provided directly by the assigned motor carrier’s commercial insurance policy and is subject to the specific policy terms, conditions, and deductibles of that carrier.
          </p>
          <p>
            • Pickup and delivery dates provided during quotes are estimates and cannot be permanently guaranteed unless explicitly agreed upon in a written contract. Weather, traffic, mechanical issues, driver ELD hours, and road conditions may impact timing.
          </p>
          <p>
            • Quotes are subject to market adjustments if vehicle condition, route details, transport type, or scheduling parameters change from original submission.
          </p>
        </div>
      </div>
    </section>
  );
}

// Main Page Export
export default function TruthAboutAutoTransportPage() {
  return (
    <main className="bg-brand-dark min-h-screen text-white">
      <SEO
        title="The Truth About Auto Transport"
        tabTitle="The Truth About Auto Transport | Road America"
        description="Learn how auto transport really works, why prices change, how carriers are selected, and how Road America provides honest pricing, carrier verification, shipment monitoring, and personal support."
        canonical="/the-truth-about-auto-transport"
        keywords={[
          "auto transport guide",
          "how car shipping works",
          "auto transport broker vs carrier",
          "car shipping pricing truth",
          "road america auto transport",
          "honest car shipping quote"
        ]}
      />

      <HeroSection />
      <TrustSection />
      <QuoteProcessSection />
      <CarrierRouteSection />
      <LowQuoteFailsSection />
      <PrivacySection />
      <ComparisonSection />
      <ServiceStandardSection />
      <WhatYouPayForSection />
      <FounderStorySection />
      <ShipmentStorySection />
      <BusinessServicesSection />
      <PromiseSection />
      <FinalCTASection />
    </main>
  );
}
