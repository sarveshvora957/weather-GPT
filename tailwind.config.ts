import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#e0f8ff",
          100: "#b8eeff",
          200: "#86e3ff",
          300: "#44d4ff",
          400: "#0bbdff",
          500: "#0099ff",
          600: "#0074db",
          700: "#005bb0",
          800: "#004d8f",
          900: "#003566",
          950: "#001e3d",
        },
        navy: {
          800: "#0b132b",
          900: "#070c1e",
          950: "#030712",
        },
        aurora: {
          cyan: "#00f0ff",
          teal: "#00e5a3",
          amber: "#ffb703",
          purple: "#9d4edd",
          rose: "#ff006e",
          sky: "#38bdf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "radial-gradient(at 0% 0%, rgba(0, 240, 255, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(157, 78, 221, 0.12) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(0, 153, 255, 0.08) 0px, transparent 50%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        "glass-gradient-dark": "linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(7, 12, 30, 0.85) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(0, 240, 255, 0.2), 0 0 20px rgba(0, 240, 255, 0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.5), 0 0 35px rgba(0, 153, 255, 0.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
        "neon-cyan": "0 0 25px rgba(0, 240, 255, 0.35)",
        "neon-amber": "0 0 25px rgba(255, 183, 3, 0.35)",
        "neon-purple": "0 0 25px rgba(157, 78, 221, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
