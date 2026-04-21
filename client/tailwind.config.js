/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Segoe UI'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -15px rgba(8, 47, 73, 0.25)",
      },
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eff6ff",
          700: "#1e3a8a",
          900: "#0f172a",
        },
      },
      keyframes: {
        pulseScale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        pulseScale: "pulseScale 220ms ease-out",
      },
    },
  },
  plugins: [],
};
