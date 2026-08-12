// src/pages/BusinessAutoTransportPage.tsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Truck,
  ShieldCheck,
  Phone,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileCheck,
  UserCheck,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Users,
  Anchor,
  Briefcase,
  Check,
  AlertCircle,
  HeartHandshake
} from "lucide-react";
import SEO from "../components/SEO";
import { createBusinessInquiry } from "../services/businessInquiriesService";

// Section 1: Hero Section
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#36383d] via-brand-dark to-[#2e2f32] py-16 md:py-24 border-b border-white/10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-redSoft via-brand-red/20 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-redSoft backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              BUSINESS AUTO TRANSPORT
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]">
              You Don’t Need Another Broker.{" "}
              <span className="bg-gradient-to-r from-brand-redSoft via-red-400 to-amber-300 bg-clip-text text-transparent">
                You Need a Better Transportation Resource.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl font-light">
              Road America helps dealerships, fleets, auctions, and businesses move vehicles without the constant follow-up, unclear expectations, and communication gaps that make transportation harder than it should be.
            </p>

            <p className="text-sm text-white/70 font-medium">
              Use us as your primary transportation partner, an overflow resource, or a dependable second option when your regular provider cannot deliver.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#business-inquiry"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition-all duration-300 hover:bg-brand-redSoft hover:shadow-brand-red/50 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                Request Business Transport Support
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
              <a
                href="#test-shipment"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 text-center"
              >
                Give Us a Test Shipment
              </a>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 text-xs sm:text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>Licensed FMCSA Broker</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>Backup / Overflow Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                <span>25+ Yrs Fleet Leadership</span>
              </div>
            </div>
          </div>

          {/* Right Column: Commercial Dashboard Visual */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-[#34363b]/95 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white/80">Commercial Dispatch Network</span>
                </div>
                <span className="text-[11px] font-mono text-brand-redSoft bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20">
                  B2B Account Portal
                </span>
              </div>

              {/* Visual Card Content */}
              <div className="space-y-4 text-xs">
                {/* Active Shipment Snapshot */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 font-semibold uppercase tracking-wider text-[10px]">
                      Dealership Batch Dispatch • Ref #RA-COMM-884
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      In Transit (4 Vehicles)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-white">
                    <div>
                      <p className="text-white/50 text-[10px]">Origin</p>
                      <p className="font-semibold text-white/90">Manheim Auto Auction (Orlando, FL)</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px]">Destination</p>
                      <p className="font-semibold text-white/90">Apex Dealer Group (Atlanta, GA)</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-white/70">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-brand-redSoft" />
                      <span>Vetted Multi-Car Transport</span>
                    </div>
                    <span className="text-emerald-400 font-medium">Carrier Insured & Verified</span>
                  </div>
                </div>

                {/* Proactive Communication Card */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-white/80">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-brand-red/20 flex items-center justify-center text-brand-redSoft flex-shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-xs">Dedicated Account Coordinator</p>
                      <p className="text-[11px] text-white/50">Pickup confirmed & BOL filed automatically</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </div>

                {/* Operational Summary */}
                <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-white/80 text-[11px] flex items-center justify-between">
                  <span className="text-white/90 font-medium">Overflow & Difficult Lane Partner</span>
                  <span className="text-brand-redSoft font-bold">Zero Chasing Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 2: Immediate Recognition Section
function OperationalImpactSection() {
  const impactSteps = [
    { title: "Vehicle Delayed", desc: "Transport provider misses pickup window or delays dispatch." },
    { title: "Reconditioning Delayed", desc: "Service bay & detailing slots sit idle or get rescheduled." },
    { title: "Sale Delayed", desc: "Retail customer or buyer cannot complete vehicle purchase." },
    { title: "Revenue Delayed", desc: "Capital stays tied up in unassigned inventory." },
    { title: "Customer Frustrated", desc: "Trust deteriorates across sales & operations teams." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Operational Disruption
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Your Transportation Provider Affects More Than Transportation.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            A delayed or poorly communicated shipment can affect inventory availability, vehicle reconditioning, sales commitments, customer delivery dates, auction purchases, employee productivity, port appointments, cash flow, customer satisfaction, and your team’s time.
          </p>
          <p className="mt-2 text-sm sm:text-base text-brand-redSoft font-semibold">
            Transportation problems rarely remain transportation problems. They quickly become operational problems.
          </p>
        </div>

        {/* Connected Chain Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {impactSteps.map((step, idx) => (
            <div key={idx} className="relative rounded-2xl border border-red-500/20 bg-red-950/20 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Step 0{idx + 1}
                  </span>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 3: "Already Have a Broker?" Section
function AlreadyHaveBrokerSection() {
  const useCases = [
    "Your regular provider cannot cover a specific shipment",
    "A vehicle has been waiting too long at an auction or dealer",
    "You need another reliable option on a difficult or remote lane",
    "You require more responsive, proactive communication",
    "A high-value or VIP move requires personal attention",
    "Volume temporarily exceeds your primary provider's capacity",
    "You want to benchmark pricing and service standards",
    "You need specialized coordination for port or Caribbean forwarders",
    "You want a backup relationship established before an emergency occurs",
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
              Low-Risk Partnership
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Already Have a Transportation Broker? Good.
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
              Most established dealerships and businesses already have one or more transportation providers. Road America does not need to replace your current broker on day one.
            </p>
            <p className="text-sm sm:text-base text-white/80 font-medium">
              We position ourselves as your overflow partner, backup resource, and difficult-lane specialist.
            </p>

            <div className="p-6 rounded-3xl border border-brand-red/30 bg-brand-red/10 text-white space-y-3">
              <h3 className="text-base font-bold text-brand-redSoft">Strategic Takeaway:</h3>
              <p className="text-sm font-semibold text-white/90 italic">
                “The best time to establish a backup transportation resource is before you urgently need one.”
              </p>
            </div>

            <div>
              <a
                href="#business-inquiry"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-brand-redSoft transition"
              >
                Add Road America as a Transport Resource
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-white/10 bg-[#36383e] p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                When Commercial Accounts Call Road America:
              </h3>

              <div className="space-y-3 text-xs sm:text-sm text-white/80">
                {useCases.map((useCase, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 4: High-Impact Scenario Section
function ScenarioSection() {
  return (
    <section className="py-16 md:py-24 bg-[#2d2e31] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-500/30 bg-gradient-to-b from-[#3a3c42] to-black p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left: The Scenario */}
            <div className="lg:col-span-6 space-y-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-8">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                The Common Industry Problem
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                The Vehicle Was Supposed to Arrive Yesterday. Now Everyone Wants an Answer.
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-red-200/80">
                <li>• Your salesperson is asking for an update.</li>
                <li>• Your customer is waiting.</li>
                <li>• The vehicle cannot enter reconditioning.</li>
                <li>• The promised delivery date is approaching.</li>
                <li>• Your transportation provider has not responded.</li>
              </ul>
              <p className="text-xs text-white/60 italic pt-2">
                This is where a simple transportation transaction becomes an operational crisis.
              </p>
            </div>

            {/* Right: The Road America Standard */}
            <div className="lg:col-span-6 space-y-6 lg:pl-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                The Road America Standard
              </span>
              <h3 className="text-xl font-bold text-white">
                Built Around Operational Accountability
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/80">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">✓ Clear Ownership</div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">✓ Responsive Communication</div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">✓ Realistic Expectations</div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">✓ Active Follow-up</div>
              </div>

              <blockquote className="p-4 rounded-2xl border-l-4 border-brand-redSoft bg-white/5 text-sm font-bold text-white">
                “You should not have to chase your broker for information about your own shipment.”
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 5: Commercial Solutions Section
function CommercialSolutionsSection() {
  const solutions = [
    { title: "Dealer Inventory Moves", desc: "Coordinate vehicle transportation between auctions, dealerships, storage facilities, customers, and reconditioning centers.", icon: Building2 },
    { title: "Auction Purchases", desc: "Arrange pickup of vehicles purchased through physical or online auctions (Manheim, Copart, IAAI) and coordinate delivery to destination.", icon: DollarSign },
    { title: "Fleet Vehicle Moves", desc: "Support vehicle relocations, assignments, transfers, replacements, upfitting movements, terminations, and corporate fleet needs.", icon: Truck },
    { title: "Employee & Executive Relocations", desc: "Coordinate vehicle moves for employee transfers, relocations, and corporate assignments with direct customer communication.", icon: Users },
    { title: "Multi-Vehicle Transportation", desc: "Support recurring shipments, dealer inventory batches, project moves, and multi-car transport requirements.", icon: Layers },
    { title: "Port & Freight Forwarder Delivery", desc: "Coordinate vehicle delivery to domestic ports, terminals, and freight forwarders, including Caribbean & U.S. Virgin Islands shipments.", icon: Anchor },
    { title: "Specialty & Commercial Vehicles", desc: "Evaluate transportation options for oversized, modified, inoperable, specialty, and commercial vehicles based on equipment demands.", icon: Sparkles },
    { title: "Overflow & Backup Coverage", desc: "Provide an additional transportation option when a company’s primary provider lacks capacity, coverage, or responsiveness.", icon: RefreshCw },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            B2B Service Portfolio
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Transportation Support Built Around Your Business
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            Custom logistics solutions tailored to commercial workflows, auctions, dealer networks, and corporate fleet operations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {solutions.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#36383e] p-6 hover:border-brand-red/40 transition group flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-redSoft mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 6: The Road America Commercial Workflow
function CommercialWorkflowSection() {
  const workflowStages = [
    { num: "01", title: "Transport Request", desc: "Business submits vehicle details, origin, destination, condition, timing, and special requirements." },
    { num: "02", title: "Shipment Review", desc: "Road America reviews route access, vehicle specs, schedule feasibility, and market conditions." },
    { num: "03", title: "Pricing & Expectations", desc: "We provide an honest transportation estimate and clarify factors affecting timing and costs." },
    { num: "04", title: "Carrier Sourcing", desc: "We identify qualified motor carrier options matching equipment, lane, and schedule criteria." },
    { num: "05", title: "Carrier Verification", desc: "We verify active operating DOT authority and required carrier cargo insurance before assignment." },
    { num: "06", title: "Pickup Coordination", desc: "We coordinate details between business, origin contact, customer, auction, or releasing party." },
    { num: "07", title: "Shipment Monitoring", desc: "Road America remains actively involved, communicates material updates, and resolves transit issues." },
    { num: "08", title: "Delivery Confirmation", desc: "We confirm delivery, inspect vehicle completion, and collect necessary transport documentation." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Operational Lifecycle
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            A Clear Process From Request to Delivery
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {workflowStages.map((stage) => (
            <div key={stage.num} className="rounded-2xl border border-white/10 bg-white/5 p-6 relative backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xl font-bold text-brand-redSoft">{stage.num}</span>
                <div className="h-2 w-2 rounded-full bg-brand-redSoft" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{stage.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold text-emerald-400 inline-flex items-center gap-2 bg-emerald-950/40 px-6 py-2.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            Our responsibility does not end when a carrier accepts the shipment.
          </p>
        </div>
      </div>
    </section>
  );
}

// Section 7: Typical Transaction vs. Road America Partnership
function CommercialComparisonSection() {
  const items = [
    { topic: "Focus", typical: "Focuses primarily on booking the load transaction", ra: "Learns how the shipment affects your operation" },
    { topic: "Pricing Context", typical: "Provides limited context around pricing shifts", ra: "Provides realistic, market-informed expectations" },
    { topic: "Point of Contact", typical: "Communication depends on who answers the phone", ra: "Offers a clear, dedicated point of contact" },
    { topic: "Updates", typical: "Customer must repeatedly request status updates", ra: "Communicates meaningful shipment updates proactively" },
    { topic: "Post-Dispatch", typical: "Shipment attention decreases after dispatch", ra: "Remains actively involved through final delivery" },
    { topic: "Relationship", typical: "Treats each vehicle as a separate transaction", ra: "Looks for repeatable, long-term transportation solutions" },
    { topic: "Problem Solving", typical: "Reacts after problems escalate to crisis level", ra: "Works to identify and resolve issues before escalation" },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Service Philosophy
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Typical Transaction vs. Road America Partnership
          </h2>
        </div>

        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-[#36383e] shadow-2xl">
          <table className="w-full text-left text-sm text-white">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="py-4 px-6">Operational Aspect</th>
                <th className="py-4 px-6 text-red-400">A Transactional Broker Experience</th>
                <th className="py-4 px-6 text-emerald-400 bg-emerald-950/20">The Road America Approach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
              {items.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="py-4 px-6 font-semibold text-white/90">{row.topic}</td>
                  <td className="py-4 px-6 text-white/60">{row.typical}</td>
                  <td className="py-4 px-6 font-semibold text-emerald-300 bg-emerald-950/10">
                    ✓ {row.ra}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {items.map((row, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#36383e] p-5 space-y-2 text-xs">
              <div className="font-bold text-white border-b border-white/10 pb-2">{row.topic}</div>
              <div className="text-red-300"><span className="font-bold text-red-400">Transactional:</span> {row.typical}</div>
              <div className="text-emerald-300 font-medium"><span className="font-bold text-emerald-400">Road America:</span> ✓ {row.ra}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-white/50 italic">
          Service requirements and communication cadence may be customized based on shipment volume and the needs of the business account.
        </p>
      </div>
    </section>
  );
}

// Section 8: Service-Level Section
function ServiceLevelSection() {
  const levels = [
    { title: "Responsive Communication", desc: "A clear point of contact who understands the shipment and responds to your team promptly.", icon: Phone },
    { title: "Realistic Expectations", desc: "Honest conversations about pricing, carrier availability, timing, route conditions, and constraints.", icon: FileCheck },
    { title: "Carrier Due Diligence", desc: "Verification of active motor-carrier authority and required insurance before carrier assignment.", icon: ShieldCheck },
    { title: "Shipment Follow-Up", desc: "Continued involvement from assignment through delivery instead of disappearing after dispatch.", icon: Clock },
    { title: "Issue Coordination", desc: "Assistance communicating with carriers, auctions, dealerships, or ports when conditions change.", icon: Layers },
    { title: "Relationship Management", desc: "An effort to understand recurring routes, priorities, and business expectations over time.", icon: HeartHandshake },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Commercial Standards
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Service Is More Than Finding an Available Truck.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            A carrier moves the vehicle. A strong transportation partner manages the experience around that movement.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {levels.map((lvl, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-red/20 text-brand-redSoft flex items-center justify-center mb-4">
                <lvl.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{lvl.title}</h3>
              <p className="text-xs text-white/70 leading-relaxed font-light">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 9: Founder and Enterprise Fleet Experience Section
function B2BFounderSection() {
  const experiences = [
    "Enterprise fleet operations leadership",
    "Vehicle maintenance management",
    "Vendor performance & accountability",
    "Customer experience optimization",
    "Escalation management & downtime reduction",
    "Process improvement & KPI reporting",
    "Commercial-client relationships across North America",
    "Cross-functional operational leadership",
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#383a40] via-black to-[#323438] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-full border-4 border-brand-red/40 bg-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
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
              <p className="text-xs text-white/50 mt-1">Former Enterprise Fleet Executive</p>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-8 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
                BUILT BY A FLEET OPERATIONS LEADER
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Road America Was Built With an Operator’s Mindset.
              </h2>

              <p className="text-sm text-white/80 leading-relaxed font-light">
                Road America Auto Transport was founded by Amilcar Charles, an automotive and fleet-management professional with more than 25 years of experience.
              </p>

              <p className="text-sm text-white/80 leading-relaxed font-light">
                Before building Road America, Amilcar worked across automotive service, fleet operations, vendor management, customer experience, process improvement, and enterprise client support. In his most recent fleet leadership role, he led a team supporting approximately <span className="font-semibold text-white">2,400 enterprise clients</span> and a portfolio representing roughly <span className="font-semibold text-white">870,000 vehicles</span> across North America.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80 pt-2">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-redSoft flex-shrink-0" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70">
                <span className="font-bold text-white">Core Operating Principles:</span> Clear ownership. Measurable service. Vendor accountability. Proactive communication. Continuous improvement.
              </div>

              <blockquote className="p-6 rounded-2xl border-l-4 border-brand-redSoft bg-brand-red/10 italic text-sm text-white/90">
                “Businesses do not need another person who can post a vehicle for transport. They need a partner who understands how a delayed vehicle affects the rest of their operation.”
                <span className="block mt-2 not-italic font-bold text-xs text-brand-redSoft">
                  — Amilcar Charles, Founder
                </span>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 10: Operational Mindset Section
function OperationalMindsetSection() {
  const mindsetQuestions = [
    { q: "What Is Being Moved?", a: "Vehicle type, size, condition, value, modifications, and equipment requirements." },
    { q: "Why Is It Being Moved?", a: "Inventory transfer, retail delivery, auction purchase, employee relocation, fleet replacement, or export." },
    { q: "What Depends On It?", a: "A retail sale, customer appointment, reconditioning slot, port cutoff, or employee start date." },
    { q: "What Could Disrupt It?", a: "Carrier capacity, route demand, access restrictions, severe weather, mechanical issues, or incomplete paperwork." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Commercial Analysis
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            We Look Beyond the Shipment.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-light">
            How Road America evaluates every commercial move to ensure operational alignment:
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mindsetQuestions.map((m, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-brand-redSoft uppercase tracking-wider block mb-2">
                  Factor 0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{m.q}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{m.a}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold text-white italic">
            “Understanding the business purpose behind a shipment helps us manage it more effectively.”
          </p>
        </div>
      </div>
    </section>
  );
}

// Section 11: Business Use Cases Section
function BusinessUseCasesSection() {
  const cases = [
    { title: "The Uncovered Lane", scenario: "Your regular provider cannot find carrier capacity on a difficult route." },
    { title: "The Aging Vehicle", scenario: "A purchased vehicle has been waiting too long at an auction or dealer lot." },
    { title: "The Urgent Customer Delivery", scenario: "A retail customer is waiting for a vehicle purchased across state lines." },
    { title: "The Auction Purchase", scenario: "A vehicle must be collected before storage fees or gate deadlines accumulate." },
    { title: "The Port Appointment", scenario: "A vehicle must reach a freight forwarder or port terminal with exact documentation." },
    { title: "The Volume Spike", scenario: "Your normal transport volume temporarily exceeds your primary provider’s capacity." },
    { title: "The High-Touch Move", scenario: "A specialty vehicle or executive relocation requires extra personal stewardship." },
    { title: "The Communication Gap", scenario: "The shipment is moving, but your team cannot get responsive status updates." },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Scenario Portfolio
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Where Road America Can Add Value
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#36383e] p-6 flex flex-col justify-between hover:border-brand-red/40 transition">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">{c.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed mb-4">{c.scenario}</p>
              </div>
              <span className="text-[11px] font-semibold text-brand-redSoft border-t border-white/10 pt-3 block">
                Road America can serve as the additional resource.
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 12: Test-Shipment Offer Section
function TestShipmentSection() {
  return (
    <section id="test-shipment" className="py-16 md:py-24 bg-[#2e3034] border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-brand-red/40 bg-gradient-to-b from-[#383a40] to-[#2c2d30] p-8 sm:p-14 text-center shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft bg-brand-red/10 px-4 py-1.5 rounded-full border border-brand-red/20 inline-block mb-6">
            LOW-RISK PILOT OFFER
          </span>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Don’t Replace Your Current Broker. Compare Us.
          </h2>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl mx-auto mb-8 font-light">
            Give Road America an opportunity to earn your business with just one vehicle, one difficult lane, one auction purchase, one customer delivery, one port movement, one overflow shipment, or one recurring route.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs text-white/80 mb-8">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-medium">✓ Responsiveness</div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-medium">✓ Pricing Transparency</div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-medium">✓ Carrier Coordination</div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-medium">✓ Ease of Doing Business</div>
          </div>

          <blockquote className="text-base sm:text-lg font-bold text-white mb-8 italic">
            “A business relationship should be earned through performance—not promises.”
          </blockquote>

          <div>
            <a
              href="#business-inquiry"
              className="inline-flex items-center justify-center rounded-full bg-brand-red px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-brand-redSoft transition"
            >
              Send Us a Test Shipment
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 13: "Are We a Good Fit?" Section
function GoodFitSection() {
  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Account Qualification
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Are We a Good Fit for Your Business?
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Good Fit */}
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Road America May Be a Good Fit If You Value:
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-white/80">
              <li>✓ A responsive point of contact who understands your business needs</li>
              <li>✓ Honest conversations about market transportation conditions</li>
              <li>✓ Support beyond carrier assignment through delivery sign-off</li>
              <li>✓ A provider that understands fleet and dealership operations</li>
              <li>✓ Flexibility for both one-time overflow and recurring moves</li>
              <li>✓ A transportation partner willing to earn more volume over time</li>
            </ul>
          </div>

          {/* Not Right Fit */}
          <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              We May Not Be the Right Fit If:
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-white/80">
              <li>✗ The only consideration is obtaining the lowest advertised number</li>
              <li>✗ You expect guaranteed carrier availability before a carrier is confirmed</li>
              <li>✗ You expect exact pickup and delivery times regardless of weather/traffic</li>
              <li>✗ You want a provider to promise something outside operational control</li>
              <li>✗ Communication and service have no value in your buying decision</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm text-white/60 italic">
            We would rather set an honest expectation than make a promise we cannot keep.
          </p>
        </div>
      </div>
    </section>
  );
}

// Section 14: Commercial Trust and Compliance Section
function ComplianceTrustSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Regulatory Compliance
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Professional Transportation Starts With Responsible Coordination.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#36383e] p-6">
            <ShieldCheck className="w-6 h-6 text-brand-redSoft mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Licensed Broker</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Road America Auto Transport is a licensed and bonded auto transport broker operating under FMCSA regulations.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#36383e] p-6">
            <FileCheck className="w-6 h-6 text-brand-redSoft mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Carrier & Insurance Verification</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              We verify active motor-carrier operating authority and required insurance credentials before assigning any carrier.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#36383e] p-6">
            <Lock className="w-6 h-6 text-brand-redSoft mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Privacy & Transparency</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Zero lead reselling. Commercial terms, payment responsibilities, and broker fees are fully disclosed in shipment docs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Section 15 & 16: Future Case Study & References Component
function B2BCaseStudyCard({ title, clientType, challenge, solution, outcome }: {
  title: string;
  clientType: string;
  challenge: string;
  solution: string;
  outcome: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between text-xs text-brand-redSoft font-semibold">
        <span>{clientType}</span>
        <span>Case Study</span>
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-xs text-white/70"><strong>Challenge:</strong> {challenge}</p>
      <p className="text-xs text-white/70"><strong>Solution:</strong> {solution}</p>
      <p className="text-xs text-emerald-300 font-medium"><strong>Outcome:</strong> {outcome}</p>
    </div>
  );
}

function B2BTestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-[#313337] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            Commercial Proof
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Trusted Through Performance
          </h2>
          <p className="mt-4 text-sm text-white/70">
            Ask us about recent business transportation projects, dealer references, and commercial case studies.
          </p>
        </div>

        {/* Modular Case Study Container */}
        <div className="grid gap-6 md:grid-cols-2">
          <B2BCaseStudyCard
            title="Supporting a Dealer With an Uncovered Lane"
            clientType="Franchise Dealership Group"
            challenge="Primary provider failed to cover 6 trade-in vehicles across 3 states before month-end."
            solution="Road America evaluated carrier corridors and assigned vetted haulers within 24 hours."
            outcome="All 6 vehicles delivered on time for month-end sales accounting."
          />
          <B2BCaseStudyCard
            title="Coordinating Time-Sensitive Auction Pickups"
            clientType="Wholesale Auto Buyer"
            challenge="Auction gate storage fee deadlines approaching on 4 purchased SUVs."
            solution="Road America coordinated pickup windows and verified carrier authority directly with Manheim dispatch."
            outcome="Zero auction storage fees incurred and complete shipment tracking provided."
          />
        </div>
      </div>
    </section>
  );
}

// Section 17: Frequently Asked Business Questions (Accordion)
function CommercialFAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    { q: "Can Road America work alongside our current transportation provider?", a: "Yes. Road America can serve as an overflow, backup, lane-specific, or additional transportation resource." },
    { q: "Do we have to commit to a minimum number of vehicles?", a: "No minimum commitment is required. Road America can evaluate both individual business shipments and recurring transportation needs." },
    { q: "Can you support recurring routes?", a: "Yes. Road America can review recurring routes and discuss an appropriate transportation process based on volume, timing, vehicle type, and market conditions." },
    { q: "Can you move vehicles purchased at auctions?", a: "Yes. Road America coordinates eligible auction pickups (Manheim, Copart, IAAI) provided required release information, payment status, and vehicle condition details are supplied." },
    { q: "Can you deliver vehicles to ports and freight forwarders?", a: "Yes. We coordinate domestic vehicle transportation to eligible ports, terminals, and freight forwarders, including Caribbean & USVI freight forwarders." },
    { q: "Can you transport inoperable vehicles?", a: "Potentially. The customer must disclose whether the vehicle starts, steers, rolls, and brakes. Special winching equipment and additional carrier fees may apply." },
    { q: "Do you guarantee pickup and delivery dates?", a: "Exact dates are not guaranteed unless confirmed in writing. Auto transport is subject to carrier availability, route conditions, weather, traffic, and ELD driver hours." },
    { q: "Who transports the vehicle?", a: "Road America is a licensed transportation broker. The vehicle is physically transported by an authorized, independent motor carrier selected for the shipment." },
    { q: "Does Road America provide cargo insurance?", a: "The assigned motor carrier maintains primary commercial cargo & liability insurance. Coverage is subject to the carrier’s policy terms, limitations, and deductibles." },
    { q: "Will our business receive a dedicated contact?", a: "Yes. Business accounts receive a clear Road America point of contact to ensure direct communication without script-reading." },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-dark border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
            B2B Clarifications
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Frequently Asked Business Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#36383e] overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 text-white hover:text-brand-redSoft font-semibold text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Section 18: Final CTA Section & Commercial Inquiry Form
function CommercialInquiryFormSection() {
  const [searchParams] = useSearchParams();

  // Form State - input name attributes preserved for Zapier/HubSpot integration
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    jobTitle: "",
    email: "",
    phone: "",
    businessType: "Franchise dealership",
    transportNeed: "One immediate shipment",
    estimatedVolume: "1–4 vehicles per month",
    pickupCityState: "",
    deliveryCityState: "",
    additionalDetails: "",
    // UTM parameters captured from URL
    utmSource: searchParams.get("utm_source") || "",
    utmMedium: searchParams.get("utm_medium") || "",
    utmCampaign: searchParams.get("utm_campaign") || "",
    qrCampaign: searchParams.get("qr_campaign") || "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
      if (!siteKey) throw new Error("Missing VITE_RECAPTCHA_SITE_KEY");
      if (!window.grecaptcha) throw new Error("Captcha not ready. Please refresh and try again.");

      const captchaToken: string = await new Promise((resolve, reject) => {
        window.grecaptcha!.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(siteKey, {
              action: "submit_business_inquiry",
            });
            resolve(token);
          } catch (err) {
            reject(err);
          }
        });
      });

      await createBusinessInquiry({ ...formData, captchaToken });

      setSubmitted(true);
    } catch (err) {
      console.error("Business inquiry submission failed:", err);
      setError("Something went wrong submitting your inquiry. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="business-inquiry" className="py-16 md:py-24 bg-[#2a2b2d] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Column: Heading, CTAs & Desktop Trust Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-redSoft">
              START WITH ONE SHIPMENT
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Let Road America Earn the Next One.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed font-light">
              Whether you need coverage for one difficult move, additional capacity, recurring transportation support, or a more responsive business relationship, Road America is ready to learn how your operation works.
            </p>

            <div className="space-y-3 pt-2">
              <a
                href="tel:17546005772"
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold"
              >
                <Phone className="w-5 h-5 text-brand-redSoft" />
                <span>Call Road America Commercial: (754) 600-5772</span>
              </a>

              <a
                href="https://wa.me/17546005772"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition text-sm font-semibold text-emerald-300"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>Message Us on WhatsApp</span>
              </a>
            </div>

            {/* Desktop View Sidebar: Trust Shield Info */}
            <div className="hidden lg:block rounded-2xl border border-white/15 bg-[#34363b] p-6 space-y-4 shadow-xl">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-redSoft flex items-center gap-2 border-b border-white/10 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Corporate Compliance & Accounting
              </h4>
              <ul className="space-y-3.5 text-xs text-white/80">
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🛡️</span>
                  <div>
                    <strong className="text-white block font-semibold">Fully Compliant</strong>
                    <span className="text-white/70">Licensed & Bonded Broker | USDOT #3735540 | MC #1320367.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🔒</span>
                  <div>
                    <strong className="text-white block font-semibold">Secure Corporate Accounting</strong>
                    <span className="text-white/70">We never request, process, or store credit card information over the phone or web. All transactions are handled securely via official QuickBooks electronic invoicing.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🚛</span>
                  <div>
                    <strong className="text-white block font-semibold">Elite Carrier Vetting</strong>
                    <span className="text-white/70">Every carrier on your route undergoes rigorous safety, authority, and insurance validation before assignment.</span>
                  </div>
                </li>
              </ul>
            </div>

            <p className="text-xs text-white/50 italic border-t border-white/10 pt-4">
              No long-term commitment is required to start a conversation or request an initial shipment review.
            </p>
          </div>

          {/* Right Column: B2B Commercial Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/15 bg-[#34363b] p-6 sm:p-10 shadow-2xl space-y-6">
              {/* Form Title & Context Copy */}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase font-display">
                  COMMERCIAL TRANSPORT INQUIRY
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-1 font-light">
                  Streamlined logistics for dealerships, fleet managers, and corporate accounts.
                </p>
              </div>

              {/* Mobile View: Inline Trust Signals stacked directly above form fields */}
              <div className="lg:hidden rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-redSoft flex items-center gap-1.5 border-b border-white/10 pb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Corporate Compliance & Accounting
                </h4>
                <ul className="space-y-2.5 text-[11px] text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-sm leading-none">🛡️</span>
                    <div>
                      <strong className="text-white block font-semibold">Fully Compliant</strong>
                      <span className="text-white/70">Licensed & Bonded Broker | USDOT #3735540 | MC #1320367.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sm leading-none">🔒</span>
                    <div>
                      <strong className="text-white block font-semibold">Secure Corporate Accounting</strong>
                      <span className="text-white/70">We never request, process, or store credit card information over the phone or web. All transactions are handled securely via official QuickBooks electronic invoicing.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sm leading-none">🚛</span>
                    <div>
                      <strong className="text-white block font-semibold">Elite Carrier Vetting</strong>
                      <span className="text-white/70">Every carrier on your route undergoes rigorous safety, authority, and insurance validation before assignment.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4 animate-fadeIn">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Thank You for Reaching Out</h4>
                  <p className="text-xs sm:text-sm text-emerald-200">
                    A Road America representative will review your transportation needs and contact you using your selected communication method.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Business Name / Company Name *</label>
                      <input
                        type="text"
                        name="businessName"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="e.g., Apex Logistics or Auto Group"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="Inventory Manager"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Business Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="john@apexauto.com"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Business Type</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                      >
                        <option value="Franchise dealership">Franchise dealership</option>
                        <option value="Independent dealership">Independent dealership</option>
                        <option value="Dealer group">Dealer group</option>
                        <option value="Auction buyer or seller">Auction buyer or seller</option>
                        <option value="Fleet operator">Fleet operator</option>
                        <option value="Corporate relocation">Corporate relocation</option>
                        <option value="Rental or mobility company">Rental or mobility company</option>
                        <option value="Repair or body shop">Repair or body shop</option>
                        <option value="Exporter">Exporter</option>
                        <option value="Freight forwarder">Freight forwarder</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Transportation Need</label>
                      <select
                        name="transportNeed"
                        value={formData.transportNeed}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                      >
                        <option value="One immediate shipment">One immediate shipment</option>
                        <option value="Recurring shipments">Recurring shipments</option>
                        <option value="Overflow or backup provider">Overflow or backup provider</option>
                        <option value="Dealer inventory">Dealer inventory</option>
                        <option value="Auction pickup">Auction pickup</option>
                        <option value="Fleet relocation">Fleet relocation</option>
                        <option value="Employee relocation">Employee relocation</option>
                        <option value="Port or freight-forwarder delivery">Port or freight-forwarder delivery</option>
                        <option value="Caribbean shipping coordination">Caribbean shipping coordination</option>
                        <option value="Specialty vehicle">Specialty vehicle</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-medium">Estimated Monthly Volume</label>
                    <select
                      name="estimatedVolume"
                      value={formData.estimatedVolume}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                    >
                      <option value="One-time shipment">One-time shipment</option>
                      <option value="1–4 vehicles per month">1–4 vehicles per month</option>
                      <option value="5–10 vehicles per month">5–10 vehicles per month</option>
                      <option value="11–25 vehicles per month">11–25 vehicles per month</option>
                      <option value="26–50 vehicles per month">26–50 vehicles per month</option>
                      <option value="More than 50 vehicles per month">More than 50 vehicles per month</option>
                      <option value="Volume varies">Volume varies</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>

                  {/* Route & Vehicle Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Pickup City & State</label>
                      <input
                        type="text"
                        name="pickupCityState"
                        value={formData.pickupCityState}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="Orlando, FL"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1 font-medium">Delivery City & State</label>
                      <input
                        type="text"
                        name="deliveryCityState"
                        value={formData.deliveryCityState}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                        placeholder="Atlanta, GA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-medium">
                      Describe Your Fleet or Multi-Vehicle Transport Needs (Optional)
                    </label>
                    <textarea
                      name="additionalDetails"
                      rows={3}
                      value={formData.additionalDetails}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:border-brand-redSoft outline-none"
                      placeholder="e.g., Moving 5 off-lease vehicles from Orlando to Atlanta, monthly volume, or custom lane requirements..."
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-medium text-center sm:text-left">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-brand-red py-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-brand-redSoft transition duration-300 disabled:opacity-50"
                  >
                    {loading ? "Submitting Inquiry..." : "REQUEST COMMERCIAL SERVICE PLAN"}
                  </button>

                  <p className="text-[11px] text-white/60 italic leading-relaxed pt-1 text-center sm:text-left">
                    🔒 <strong>Data Security Promise:</strong> We respect your business environment. Expect one professional email response containing your custom logistics plan. Absolutely no automated robocalls or broker phone spam.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Operational Disclaimers */}
        <div className="mt-16 pt-8 border-t border-white/10 text-xs text-white/50 space-y-2 font-light leading-relaxed max-w-5xl mx-auto">
          <p className="font-semibold text-white/70">Legal & Operational Disclaimers:</p>
          <p>
            • Road America Auto Transport is a licensed and bonded auto transport broker under FMCSA registration (USDOT #3735540 | MC #1320367). Road America does not own or operate trucks directly, nor are motor carrier drivers employees of Road America.
          </p>
          <p>
            • Primary cargo and vehicle transit coverage is provided directly by the assigned motor carrier’s commercial policy and is subject to that carrier’s terms, conditions, deductibles, and limitations.
          </p>
          <p>
            • Pickup and delivery timelines provided during quotes are estimates and cannot be permanently guaranteed unless specifically agreed upon in writing. Weather, traffic, driver ELD hours, and market availability affect timelines.
          </p>
        </div>
      </div>
    </section>
  );
}

// Main Component Export
export default function BusinessAutoTransportPage() {
  return (
    <main className="bg-brand-dark min-h-screen text-white">
      <SEO
        title="Business Auto Transport Solutions"
        tabTitle="Business Auto Transport Solutions | Road America Auto Transport"
        description="Road America helps dealerships, fleets, auctions, businesses, and relocation professionals coordinate vehicle transportation with dedicated support, clear communication, carrier verification, and shipment monitoring."
        canonical="/business-auto-transport"
        keywords={[
          "business auto transport",
          "dealership car shipping",
          "fleet vehicle relocation",
          "auction auto transport",
          "b2b vehicle logistics",
          "commercial car broker"
        ]}
      />

      <HeroSection />
      <OperationalImpactSection />
      <AlreadyHaveBrokerSection />
      <ScenarioSection />
      <CommercialSolutionsSection />
      <CommercialWorkflowSection />
      <CommercialComparisonSection />
      <ServiceLevelSection />
      <B2BFounderSection />
      <OperationalMindsetSection />
      <BusinessUseCasesSection />
      <TestShipmentSection />
      <GoodFitSection />
      <ComplianceTrustSection />
      <B2BTestimonialsSection />
      <CommercialFAQSection />
      <CommercialInquiryFormSection />
    </main>
  );
}
