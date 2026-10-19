// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "var(--color-primary)",
          redSoft: "var(--color-primary-hover)",
          dark: "var(--color-background)",
          gray: "var(--color-text-supporting)",
          light: "var(--color-background-warm)",
        },
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        "text-supporting": "var(--color-text-supporting)",
        "accent-dark-red": "var(--color-accent-dark-red)",
        header: "var(--color-header)",
        "background-warm": "var(--color-background-warm)",
        "tracking-bg": "var(--color-tracking-background)",
        "founder-bg": "var(--color-founder-background)",
        "cta-bg": "var(--color-cta-background)",
        "footer-bg": "var(--color-footer-background)",
        "footer-text": "var(--color-footer-text)",
        "gold-bg": "var(--color-gold-background)",
        "gold-border": "var(--color-gold-border)",
        "gold-heading": "var(--color-gold-heading)",
        "gold-label": "var(--color-gold-label)",
        "trust-check": "var(--color-trust-check)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "soft-card": "0 18px 45px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
