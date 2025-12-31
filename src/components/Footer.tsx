// src/components/Footer.tsx
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#121212] border-t border-white/10 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-10 md:grid-cols-4">

        {/* Brand */}
        <div>
          <h3 className="text-lg font-semibold">Road America Auto Transport</h3>
          <p className="mt-3 text-sm text-white/60 max-w-xs">
            Premium vehicle transport with clear communication, trusted carriers, 
            and real-time tracking.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Transport</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/quote" className="hover:text-white">Get a Quote</Link></li>
            <li><Link to="/track" className="hover:text-white">Track Shipment</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>

        {/* Legal + Admin */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/privacy" className="hover:text-white">
        Privacy Policy
            </Link>
            </li>
             <li>
    <Link to="/terms" className="hover:text-white">
      Terms &amp; Conditions
    </Link>
  </li>

            <li>
              <Link
                to="/admin/login"
                className="hover:text-brand-redSoft text-white/50 text-[11px] tracking-wide"
              >
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4 text-center text-[11px] text-white/50">
        © {new Date().getFullYear()} Road America Auto Transport. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
