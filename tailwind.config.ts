import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          900: "#0e1f17",
          700: "#1e3b2f",
          600: "#2a4a3a"
        },
        clay: {
          500: "#b46e4c",
          400: "#c98560"
        },
        sandstone: {
          200: "#e7dcc7",
          100: "#f4efe6"
        },
        sky: {
          500: "#5b8fa8",
          300: "#7fb0c6"
        },
        moss: {
          500: "#6d8f3b"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "topo": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\" fill=\"none\"><path d=\"M0 20 C 20 10 40 10 60 20 C 80 30 100 30 120 20\" stroke=\"%23d8ccb6\" stroke-width=\"1.2\"/><path d=\"M0 60 C 20 50 40 50 60 60 C 80 70 100 70 120 60\" stroke=\"%23d8ccb6\" stroke-width=\"1.2\"/><path d=\"M0 100 C 20 90 40 90 60 100 C 80 110 100 110 120 100\" stroke=\"%23d8ccb6\" stroke-width=\"1.2\"/></svg>')"
      },
      boxShadow: {
        "soft": "0 10px 30px rgba(14, 31, 23, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
