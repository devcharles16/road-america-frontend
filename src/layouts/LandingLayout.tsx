import { Outlet, Link } from "react-router-dom";

const LandingLayout = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white flex flex-col">
            {/* Simplified Header */}
            <header className="bg-[#121212]/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Road America Auto Transport"
                            className="h-10 w-auto object-contain"
                        />
                        <span className="text-sm md:text-xl font-bold tracking-wide text-white whitespace-nowrap">
                            Road America Auto Transport
                        </span>
                    </Link>

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
