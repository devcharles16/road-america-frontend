// src/pages/AboutPage.tsx
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const AboutPage = () => {
  return (
    <main className="bg-brand-dark text-white min-h-screen">
      <SEO
        title="About Us"
        description="Learn about Road America Auto Transport's mission to provide reliable, transparent vehicle shipping services nationwide."
        canonical="/about"
      />
      {/* Hero */}
      <section className="relative min-h-[30vh] flex items-center border-b border-white/5 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://yjkxjnzfzrrvaftqqxbt.supabase.co/storage/v1/object/public/public-site/blog/opentransport.jpg"
            alt="Auto Transport on the road"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 w-full">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-redSoft font-bold">
            About Us
          </p>
          <h1 className="mt-1 font-display text-2xl md:text-3xl font-semibold text-white drop-shadow-sm">
            Road America Auto Transport
          </h1>
          <p className="mt-2 max-w-xl text-xs md:text-sm text-white/90 leading-relaxed font-light drop-shadow-sm">
            We help dealerships, relocators, and everyday drivers move their
            vehicles with confidence. From first quote to final delivery,
            we treat every transport like it&apos;s our own.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/quote"
              className="rounded-full bg-brand-red px-5 py-2 text-[11px] font-semibold text-white shadow-soft-card hover:bg-brand-redSoft transition-all transform hover:-translate-y-0.5"
            >
              Get a Transport Quote
            </Link>
            <Link
              to="/track"
              className="rounded-full border border-white/30 backdrop-blur-sm bg-white/5 px-5 py-2 text-[11px] font-semibold text-white hover:bg-white/10 hover:border-white transition-all transform hover:-translate-y-0.5"
            >
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="border-b border-white/5 bg-[#121212]/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="space-y-12">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-white">
                About Road America Auto Transport
              </h2>
              <div className="mt-6 space-y-6 text-sm md:text-base text-white/70 leading-relaxed">
                <p>
                  Road America Auto Transport exists for people who want honest answers, fair pricing, and real support when shipping a vehicle.
                </p>
                <p>
                  Too many auto transport companies rely on pressure tactics, vague quotes, and disappear once payment is made. We built Road America to do the opposite—by putting transparency, accountability, and customer experience first.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                Rooted in the Automotive World
              </h3>
              <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
                Road America was founded by an ASE-Certified Master Technician with more than 25 years in the automotive industry, including leadership roles within some of the world’s largest fleet management organizations.
                <br /><br />
                <span className="font-semibold text-white">That experience matters.</span> It means we understand vehicles beyond paperwork—how they’re handled, how damage happens, and how shipments should be managed properly. We don’t just move cars; we protect them.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                What Makes Us Different
              </h3>
              <ul className="mt-6 space-y-4">
                {[
                  "Clear, explained pricing — no bait-and-switch",
                  "Licensed & bonded brokerage",
                  "Vetted, insured carriers",
                  "No spam, no lead reselling",
                  "Real people who stay involved from pickup to delivery"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-red flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                Customer Experience Comes First
              </h3>
              <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
                Every shipment is different. We take the time to explain your options, set realistic expectations, and communicate throughout the process. You’ll work with people who know your shipment—not scripts.
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
              Ready to Get Started?
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              If you value integrity, expertise, and a customer-first approach, we’re here to help.
            </p>
            <p className="mt-8 text-sm font-semibold italic text-brand-red/90">
              Road America Auto Transport — shipping vehicles the right way.
            </p>
          </div>
          <div className="flex flex-col gap-3">
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
                Login
              </Link>


            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
