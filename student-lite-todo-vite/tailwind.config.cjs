/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5b7c8d",
          soft: "#e9f0f3",
          dark: "#385566"
        },
        ok: "#2f7d68",
        warn: "#9c4b3b"
      }
    }
  },
  plugins: []
};
