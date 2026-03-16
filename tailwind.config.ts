import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F8F9F4",
        ink: "#1C2A28",
        mint: "#6FD3C8",
        sunset: "#FF9868",
        sky: "#86B7FF",
        sand: "#F4E7C5",
      },
      boxShadow: {
        card: "0 8px 24px rgba(28, 42, 40, 0.08)",
      },
      borderRadius: {
        soft: "1rem",
      },
      backgroundImage: {
        "hero-wash": "radial-gradient(circle at 15% 20%, rgba(111, 211, 200, 0.35), transparent 45%), radial-gradient(circle at 85% 10%, rgba(255, 152, 104, 0.25), transparent 35%), linear-gradient(160deg, #f9fbf8 0%, #eef5ff 50%, #fff9f0 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
