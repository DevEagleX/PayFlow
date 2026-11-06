/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F5FB",
        surface: "#FFFFFF",
        ink: "#14122B",
        muted: "#625F86", // body-secondary text, >= 5:1 on white
        faint: "#A09EBD", // icons / placeholders only, never body text
        line: "#E8E6F4",
        brand: {
          DEFAULT: "#3A33C0", // buttons, active states
          dark: "#2B2597",
          mid: "#4A43D6", // chart series 1 (validated against coral)
          soft: "#ECEBFB"
        },
        coral: {
          DEFAULT: "#EB6834", // chart series 2 (validated against indigo)
          dark: "#B9461A",
          soft: "#FFF0EA"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,18,43,0.04), 0 10px 30px -12px rgba(20,18,43,0.10)",
        pop: "0 12px 40px -8px rgba(20,18,43,0.25)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        rise: "rise 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        pop: "pop 420ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both"
      }
    }
  },
  plugins: []
};
