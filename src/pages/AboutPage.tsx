// src/pages/AboutPage.tsx
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <main className="bg-brand-dark text-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-black via-[#18181C] to-black border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-redSoft">
            About Us
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-semibold">
            Road America Auto Transport
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-white/70">
            We help dealerships, relocators, and everyday drivers move their
            vehicles with confidence. From first quote to final delivery,
            we treat every transport like it&apos;s our own.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/quote"
              className="rounded-full bg-brand-red px-6 py-3 text-xs md:text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft"
            >
              Get a Transport Quote
            </Link>
            <Link
              to="/track"
              className="rounded-full border border-white/30 px-6 py-3 text-xs md:text-sm font-semibold text-white hover:border-brand-redSoft"
            >
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story + Mission */}
      <section className="border-b border-white/5 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Our Story
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Road America Auto Transport was created for people who want
              premium service without the guessing game. We work with vetted
              carriers, clear communication, and live status updates so you know
              exactly where your vehicle is in the process.
            </p>
            <p className="mt-3 text-sm text-white/70">
              Whether you&apos;re moving across the country, buying out of
              state, or shipping inventory, our team is focused on one thing:
              getting your vehicle where it needs to go—safely, on time, and
              with as little stress as possible.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Our Promise
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-white/70">
              <li>
                <span className="font-semibold text-white">Transparent pricing</span>{" "}
                — no surprise fees after your quote is confirmed.
              </li>
              <li>
                <span className="font-semibold text-white">Clear communication</span>{" "}
                — email confirmations, status updates, and a client portal to
                view all of your transports.
              </li>
              <li>
                <span className="font-semibold text-white">Trusted carriers</span>{" "}
                — we work with insured, experienced drivers who understand high
                value vehicles and timelines.
              </li>
              <li>
                <span className="font-semibold text-white">Real support</span>{" "}
                — human help when you have questions about pickup windows,
                delivery timing, or special handling.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-white/5 bg-black/60">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="font-display text-xl md:text-2xl font-semibold">
            How Your Transport Works
          </h2>
          <p className="mt-2 text-sm text-white/70 max-w-2xl">
            We use a simple, trackable flow so you always know what&apos;s next.
            The same statuses you see in the portal are the ones we use
            internally to manage your shipment.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              {
                label: "Submitted",
                desc: "You requested a quote and shared your pickup, delivery, and vehicle details.",
              },
              {
                label: "Driver Assigned",
                desc: "We match your transport with a vetted carrier and confirm estimated dates.",
              },
              {
                label: "In Transit",
                desc: "Your vehicle is on the road. You can check status anytime in the portal.",
              },
              {
                label: "Delivered",
                desc: "The vehicle has arrived and delivery is confirmed with you or your contact.",
              },
              {
                label: "Cancelled",
                desc: "Occasionally a shipment is cancelled or rescheduled at your request.",
              },
            ].map((step, idx) => (
              <div
                key={step.label}
                className="relative rounded-2xl border border-white/10 bg-black/60 p-4 shadow-soft-card"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-brand-redSoft">
                    Step {idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {step.label}
                </h3>
                <p className="mt-2 text-[11px] text-white/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve + Coverage */}
      <section className="border-b border-white/5 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Who We Serve
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-white/70">
              <li>
                <span className="font-semibold text-white">
                  Individuals & families
                </span>{" "}
                relocating, buying or selling vehicles across state lines.
              </li>
              <li>
                <span className="font-semibold text-white">Dealers & brokers</span>{" "}
                needing reliable, repeated transports with clear communication.
              </li>
              <li>
                <span className="font-semibold text-white">
                  Online buyers & sellers
                </span>{" "}
                using marketplaces and needing secure, insured shipping.
              </li>
              <li>
                <span className="font-semibold text-white">
                  Snowbirds & seasonal movers
                </span>{" "}
                who ship vehicles between home bases each year.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Coverage & Future Expansion
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Today, we focus on vehicle transport within the United States,
              with door-to-door service in most major markets. As we grow, we
              plan to extend into freight and specialized shipments while
              keeping the same level of service and transparency.
            </p>
            <p className="mt-3 text-sm text-white/70">
              If you have recurring transport needs or a unique route, our team
              can design a custom plan and pricing structure for you.
            </p>
          </div>
        </div>
      </section>

      {/* Stats / Trust Bar */}
      <section className="border-b border-white/5 bg-black/70">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-5 text-center">
              <p className="text-2xl font-semibold text-brand-red">4</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
                Core Statuses
              </p>
              <p className="mt-2 text-[11px] text-white/60">
                Submitted, Driver Assigned, In Transit, Delivered — easy to
                understand and track.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 p-5 text-center">
              <p className="text-2xl font-semibold text-brand-red">24/7</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
                Tracking Access
              </p>
              <p className="mt-2 text-[11px] text-white/60">
                Check the status of your shipment anytime using your reference
                ID and email.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 p-5 text-center">
              <p className="text-2xl font-semibold text-brand-red">1</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
                Dedicated Team
              </p>
              <p className="mt-2 text-[11px] text-white/60">
                One point of contact to coordinate your transport from quote to
                delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Ready to schedule your next transport?
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              Start with a quick quote, then track your shipment online or via
              the client portal. We&apos;ll handle the logistics—so you don&apos;t
              have to.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/quote"
              className="rounded-full bg-brand-red px-6 py-3 text-xs md:text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft"
            >
              Get a Quote
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/30 px-6 py-3 text-xs md:text-sm font-semibold text-white hover:border-brand-redSoft"
            >
              Client Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
