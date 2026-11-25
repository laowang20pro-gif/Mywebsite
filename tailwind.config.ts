
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#635BFF",
          dark: "#5145CD",
          light: "#EEF0FF"
        },
        surface: "#FFFFFF",
        canvas: "#F7F8FA"
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px"
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15,23,42,0.05)"
      }
    }
  },
  plugins: []
};

export default config;

