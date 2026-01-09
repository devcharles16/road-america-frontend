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
          red: "#b91c1c",
          redSoft: "#ef4444",
          // 🔽 updated to Smoky Graphite
          dark: "#111215",
          gray: "#1f2933",
          light: "#f3f4f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "soft-card": "0 18px 45px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
