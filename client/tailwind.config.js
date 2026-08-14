/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0ea5e9",
          foreground: "#ffffff",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        brand: {
          purple: "#7C3AED",
          blue: "#3B82F6",
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          coral: "#EF4444",
          magenta: "#EC4899",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      maxWidth: {
        'dashboard': '1440px',
        'workflow': '1280px',
        'form': '960px',
        'reading': '760px',
      },
      boxShadow: {
        'glow-subtle': '0 10px 25px -5px rgba(14, 165, 233, 0.08)',
        'glow-purple': '0 0 25px -5px rgba(14, 165, 233, 0.45), 0 0 10px -2px rgba(14, 165, 233, 0.3)',
        'glow-blue': '0 0 25px -5px rgba(14, 165, 233, 0.45), 0 0 10px -2px rgba(14, 165, 233, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.45), 0 0 10px -2px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.45), 0 0 10px -2px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.45), 0 0 10px -2px rgba(245, 158, 11, 0.3)',
        'glow-coral': '0 0 25px -5px rgba(239, 68, 68, 0.45), 0 0 10px -2px rgba(239, 68, 68, 0.3)',
        'glow-magenta': '0 0 25px -5px rgba(14, 165, 233, 0.45), 0 0 10px -2px rgba(6, 182, 212, 0.3)',
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}



