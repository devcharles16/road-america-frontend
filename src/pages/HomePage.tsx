// src/pages/HomePage.tsx
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Car } from "lucide-react";
import SEO from "../components/SEO";

const openTransportImg = "https://yjkxjnzfzrrvaftqqxbt.supabase.co/storage/v1/object/public/public-site/blog/opentransport.jpg";
const enclosedTransportImg = "https://yjkxjnzfzrrvaftqqxbt.supabase.co/storage/v1/object/public/public-site/blog/enclosedtransport.png";
const inoperableVehicleImg = "https://yjkxjnzfzrrvaftqqxbt.supabase.co/storage/v1/object/public/public-site/blog/inoperablevehicle.jpg";

const services = [
  {
    title: "Open Transport",
    description: "Affordable, reliable shipping for most everyday vehicles.",
    href: "/blog/open-vs-enclosed-auto-transport-which-option-is-best-for-your-vehicle",
    ariaLabel: "Learn more about open auto transport",
    image: openTransportImg,
  },
  {
    title: "Enclosed Transport",
    description: "Extra protection for classics, luxury, and high-value cars.",
    href: "/blog/open-vs-enclosed-auto-transport-which-option-is-best-for-your-vehicle",
    ariaLabel: "Learn more about enclosed auto transport",
    image: enclosedTransportImg,
  },
  {
    title: "Inoperable Vehicles",
    description: "Transport solutions for non-running vehicles.",
    href: "/blog/how-to-transport-an-inoperable-vehicle-what-you-need-to-know-before-shipping-a-n",
    ariaLabel: "Learn more about inoperable vehicle transport",
    image: inoperableVehicleImg,
  },
];

const steps = [
  {
    title: "Request a Quote",
    description: "Tell us your pickup, delivery, and vehicle details online.",
  },
  {
    title: "We Assign a Carrier",
    description: "We match you with a vetted carrier from our network.",
  },
  {
    title: "Track Delivery",
    description: "Follow status updates until your vehicle is delivered.",
  },
];

const blogPosts = [
  {
    title: "How to Prepare Your Car for Transport",
    tag: "Guides",
    href: "/blog/how-to-prepare-your-car-for-transport",
  },
  {
    title: "Open vs. Enclosed Auto Shipping",
    tag: "Education",
    href: "/blog/open-vs-enclosed-auto-transport-which-option-is-best-for-your-vehicle",
  },
  {
    title: "What to Expect on Pickup Day",
    tag: "Tips",
    href: "/blog/what-to-expect-on-pickup-day",
  },
];


// Predefined sample shipments
const sampleShipments = [
  {
    pickup: "Miami, FL",
    delivery: "Dallas, TX",
    vehicle: "2023 BMW M4",
    status: "In Transit",
    progress: 0.66, // 66%
    eta: "ETA: 2–3 business days · Fully insured carrier",
  },
  {
    pickup: "Los Angeles, CA",
    delivery: "Seattle, WA",
    vehicle: "2020 Tesla Model X",
    status: "Driver Assigned",
    progress: 0.33,
    eta: "Pickup scheduled · Carrier confirmed",
  },
  {
    pickup: "Atlanta, GA",
    delivery: "New York, NY",
    vehicle: "2022 Mercedes GLE",
    status: "Delivered",
    progress: 1.0,
    eta: "Delivered · Signed & completed",
  },
  {
    pickup: "Chicago, IL",
    delivery: "Phoenix, AZ",
    vehicle: "2019 Honda Accord",
    status: "Submitted",
    progress: 0.1,
    eta: "Awaiting carrier assignment",
  },
];

function HeroSection() {
  const navigate = useNavigate();

  const [shipment] = useState(() => {
    return sampleShipments[Math.floor(Math.random() * sampleShipments.length)];
  });


  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-black via-brand-gray to-brand-red py-20">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff22,_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center">
        {/* Left: text */}
        <div className="md:w-1/2">
          <p className="mb-3 inline-block rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-redSoft">
            Road America Auto Transport
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            Reliable, Luxury-Level
            <span className="block text-brand-redSoft">Vehicle Transport</span>
            Across the U.S.
          </h1>
          <p className="mt-4 max-w-xl text-sm md:text-base text-white/80">
            Door-to-door auto transport with white-glove service, insured
            carriers, and status updates—for everyday cars and
            high-value vehicles.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/quote")}
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-soft-card transition hover:bg-brand-redSoft"
            >
              Get a Quote
            </button>
            <button
              onClick={() => navigate("/track")}
              className="rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 hover:border-white"
            >
              Track Shipment
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-xs text-white/60">
            <div>
              <p className="font-semibold text-white">5 / 5</p>
              <p>Average customer rating</p>
            </div>
            <div>
              <p className="font-semibold text-white">10k+</p>
              <p>Vehicles shipped</p>
            </div>
            <div>
              <p className="font-semibold text-white">Nationwide</p>
              <p>Coverage across all states</p>
            </div>
          </div>
        </div>

        {/* Right: visual card */}
        <div className="md:w-1/2">
          <div className="relative mx-auto max-w-md rounded-3xl bg-gradient-to-br from-brand-gray to-black p-6 shadow-soft-card">
            <div className="mb-4 flex items-center justify-between text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Live Transport Snapshot
              </span>
              <span>{`RA-10234`}</span>
            </div>

            <div className="rounded-2xl bg-black/40 p-4 transition-all duration-500">
              <div className="flex items-center justify-between text-xs text-white/80">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/50">
                    Pickup
                  </p>
                  <p className="font-semibold">{shipment.pickup}</p>
                </div>

                <Car className="text-brand-red w-5 h-5" />

                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-white/50">
                    Delivery
                  </p>
                  <p className="font-semibold">{shipment.delivery}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-white/70">
                <div>
                  <p className="text-[11px] uppercase text-white/50">Vehicle</p>
                  <p>{shipment.vehicle}</p>
                </div>

                <div>
                  <p className="text-[11px] uppercase text-white/50">Status</p>
                  <p className="rounded-full bg-brand-red/20 px-3 py-1 text-[11px] font-semibold text-brand-redSoft">
                    {shipment.status}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-redSoft transition-all duration-500"
                  style={{ width: `${shipment.progress * 100}%` }}
                />
              </div>

              <p className="mt-3 text-[11px] text-white/60">{shipment.eta}</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 text-brand-dark">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              What We Offer
            </h2>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Flexible auto transport options for everyday drivers, collectors,
              dealers, and relocations.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            All services include vetted carriers, tracking updates, and licensed
            & insured transport.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-gray-100 bg-brand-light/60 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 h-48 w-full overflow-hidden rounded-xl bg-brand-light">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="font-semibold text-brand-dark">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {service.description}
              </p>
              <Link
                to={service.href}
                aria-label={service.ariaLabel ?? `Learn more about ${service.title}`}
                className="mt-4 inline-block text-xs font-semibold text-brand-red hover:text-brand-redSoft"
              >
                Learn more →
              </Link>

            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-brand-dark py-16 text-white border-t border-white/5"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">
          How It Works
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          A simple, guided process from quote to delivery—whether you’re
          shipping across the state or across the country.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.title} className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-sm font-semibold">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-white/70">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogPreviewSection() {
  return (
    <section id="blog" className="bg-white py-16 text-brand-dark">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              From the Blog
            </h2>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Education and tips to help your shipment go smoothly.
            </p>
          </div>
          <Link
            to="/blog"
            className="text-brand-redSoft hover:text-brand-red text-sm font-semibold"
          >
            View all articles →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.title}
              to={post.href}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-3 h-48 w-full overflow-hidden rounded-xl bg-brand-light">
                <img
                  src={openTransportImg}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-redSoft">
                {post.tag}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-brand-dark group-hover:text-brand-redSoft transition-colors">
                {post.title}
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Short teaser copy about the topic. This will link to the full
                article in your blog.
              </p>
              <span className="mt-3 text-xs font-semibold text-brand-red group-hover:text-brand-redSoft">
                Read article →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToActionSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-brand-dark py-14 text-white border-t border-white/5">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">
          Ready to ship your vehicle with Road America Auto Transport?
        </h2>
        <p className="mt-3 text-sm text-white/70">
          Start with a quick quote—no obligation. We’ll pair you with a vetted
          carrier and keep you updated every mile of the way.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate("/quote")}
            className="rounded-full bg-brand-red px-8 py-3 text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft"
          >
            Get a Quote
          </button>
          <button
            onClick={() => {
              const w = window as any;

              const openChat = () => {
                if (!w.tidioChatApi) return;
                w.tidioChatApi.open();
                w.tidioChatApi.messageFromVisitor(
                  "Hi, I'd like to talk to a transport specialist."
                );
              };

              if (w.tidioChatApi) {
                openChat();
              } else {
                document.addEventListener("tidioChat-ready", openChat, { once: true });
              }
            }}
            className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white hover:border-white"
          >
            Talk to a Transport Specialist
          </button>

        </div>
      </div>
    </section>
  );
}

const HomePage = () => {
  return (
    <>
      <SEO
        title="Nationwide Auto Transport Services"
        tabTitle="RA Auto Transport"
        description="Reliable, insured, door-to-door auto transport across the USA. GPS tracking, no upfront deposit, and 5-star rated carriers."
        canonical="/"
      />
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <BlogPreviewSection />
      <CallToActionSection />

    </>
  );
};

export default HomePage;
