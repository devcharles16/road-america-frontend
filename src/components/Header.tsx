// src/components/Header.tsx
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-wide text-white">
          Road America Auto Transport
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">

          <Link to="/" className="hover:text-white">Home</Link>

          <Link to="/quote" className="hover:text-white">
            Get a Quote
          </Link>

          <Link to="/track" className="hover:text-white">
            Track Shipment
          </Link>

          <Link to="/blog" className="hover:text-white">
            Blog
          </Link>

          {/* Client Portal */}
          <Link to="/login" className="hover:text-brand-red">
            Client Login
          </Link>

          

           <Link to="/about" className="hover:text-white">About</Link>

          

          {/* Subtle Admin Link */}
          <Link
            to="/admin/login"
            className="hover:text-brand-redSoft text-white/40 text-[11px] tracking-wide"
          >
            Admin
          </Link>

          
        </nav>

        {/* Mobile Menu Placeholder – we can add this tomorrow */}
        <div className="md:hidden text-white text-xl">☰</div>
      </div>
    </header>
  );
};

export default Header;