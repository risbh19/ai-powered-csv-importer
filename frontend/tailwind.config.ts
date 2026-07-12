import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        surface: "#F7F8FA",
        panel: "#FFFFFF",
        line: "#E4E7EC",
        accent: {
          DEFAULT: "#4C5FD5",
          soft: "#EEF0FD",
          dark: "#3A47A8",
        },
        success: {
          DEFAULT: "#2F9E6E",
          soft: "#E7F6EF",
        },
        warning: {
          DEFAULT: "#E2A63B",
          soft: "#FBF1DD",
        },
        danger: {
          DEFAULT: "#D5544C",
          soft: "#FBEAE9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,23,31,0.04), 0 8px 24px rgba(20,23,31,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
