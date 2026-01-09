import { Outlet, Link } from "react-router-dom";

const LandingLayout = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white flex flex-col">
            {/* Simplified Header */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 supports-[backdrop-filter]:bg-[#121212]/60">
                <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 group">
                        <img
                            src="/logo.png"
                            alt="Road America Auto Transport"
                            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <span className="text-sm md:text-lg font-display font-bold tracking-wide text-white whitespace-nowrap">
                            Road America
                        </span>
                    </Link>

                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors border border-white/5"
                    >
                        Get Quote
                    </button>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            {/* Simplified Footer */}
            <footer className="bg-[#121212] border-t border-white/10 text-white py-8">
                <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-white/50">
                        © {new Date().getFullYear()} Road America Auto Transport. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-xs text-white/50">
                        <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingLayout;
