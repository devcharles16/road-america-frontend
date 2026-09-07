import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SEO from "../components/SEO";
import { getAllRoutes } from "../data/routesData";
import { Truck, Search, MapPin, Clock, ArrowRight, ShieldCheck, Star } from "lucide-react";

export default function CarShippingRoutesIndexPage() {
    const routes = getAllRoutes();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRoutes = routes.filter((route) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            route.fromCity.toLowerCase().includes(query) ||
            route.fromState.toLowerCase().includes(query) ||
            route.toCity.toLowerCase().includes(query) ||
            route.toState.toLowerCase().includes(query) ||
            route.h1Title.toLowerCase().includes(query)
        );
    });

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
        ],
    };

    return (
        <div className="bg-brand-dark min-h-screen text-white">
            <SEO
                title="Car Shipping Routes & City-to-City Auto Transport"
                description="Explore popular city-to-city car shipping routes across the US. Get estimated transit times, distances, and instant door-to-door auto transport quotes."
                canonical="/car-shipping-routes"
                keywords={[
                    "car shipping routes",
                    "auto transport corridors",
                    "city to city car shipping",
                    "interstate vehicle transport",
                    "cross country car shipping routes",
                ]}
            />

            <Helmet>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            {/* HERO SECTION */}
            <section className="relative pt-28 pb-16 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-[#3a3a3a] to-brand-red/10" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5 text-xs font-bold text-brand-redSoft border border-brand-red/20 mb-6 backdrop-blur-sm">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Nationwide Door-to-Door Auto Transport</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6 tracking-tight">
                        Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping Routes</span>
                    </h1>

                    <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Explore our top city-to-city auto transport corridors. Road America provides fully insured, hand-calculated vehicle shipping quotes with zero hidden fees across the United States.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative mb-8">
                        <div className="relative flex items-center">
                            <Search className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by city or state (e.g. Miami, Texas, Los Angeles)..."
                                className="w-full h-13 pl-12 pr-4 bg-white text-gray-900 placeholder-gray-400 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-red/20 outline-none shadow-xl transition"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-xs text-white/70">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <ShieldCheck className="w-4 h-4 text-brand-redSoft" />
                            <span>100% Insured Carriers</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <Star className="w-4 h-4 text-brand-redSoft fill-current" />
                            <span>5-Star Rated Service</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <MapPin className="w-4 h-4 text-brand-redSoft" />
                            <span>Door-to-Door Delivery</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ROUTES INDEX GRID */}
            <section className="py-16 bg-white text-gray-900">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200">
                        <div>
                            <h2 className="text-2xl font-bold font-display text-gray-900">
                                Available Auto Transport Corridors
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Showing {filteredRoutes.length} of {routes.length} total routes
                            </p>
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-xs font-bold text-brand-red hover:underline mt-2 md:mt-0"
                            >
                                Clear search filter
                            </button>
                        )}
                    </div>

                    {filteredRoutes.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 max-w-md mx-auto">
                            <p className="text-gray-500 text-sm mb-4">No routes match "{searchQuery}".</p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="bg-brand-red text-white text-xs font-bold py-2.5 px-5 rounded-lg hover:bg-brand-redSoft transition"
                            >
                                View All Routes
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRoutes.map((route) => (
                                <Link
                                    key={route.id}
                                    to={`/car-shipping-routes/${route.slug}`}
                                    className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-brand-red/30 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-bold text-brand-red mb-3 bg-brand-red/5 px-3 py-1.5 rounded-lg">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {route.approximateDistance}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {route.estimatedTransitTime}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold font-display text-gray-900 group-hover:text-brand-red transition mb-2 flex items-center justify-between">
                                            <span>
                                                {route.fromCity}, {route.fromState} → {route.toCity}, {route.toState}
                                            </span>
                                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                                        </h3>

                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                                            {route.introductoryCopy}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                                        <span>Door-to-Door Transport</span>
                                        <span className="text-brand-red group-hover:underline flex items-center gap-1 font-bold">
                                            View Route Details →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* QUICK CTA */}
            <section className="bg-brand-red py-12 text-white text-center">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                        Don't see your specific route listed?
                    </h2>
                    <p className="mb-6 opacity-90 text-sm md:text-base">
                        We ship vehicles between any two cities in all 50 US states. Request an instant quote now!
                    </p>
                    <Link
                        to="/quote"
                        className="inline-block bg-white text-brand-red font-bold py-3.5 px-8 rounded-full shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-0.5"
                    >
                        Get Custom Auto Transport Quote
                    </Link>
                </div>
            </section>
        </div>
    );
}
