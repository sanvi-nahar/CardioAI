/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f4ff",
          100: "#d1e8ff",
          200: "#a3d1ff",
          500: "#0d8bdc",
          600: "#0a76b8",
          700: "#075c8c",
        },
        sidebar: {
          bg: "#04324d",
        }
      },
      borderRadius: {
        xl: "1rem",
      },
      boxShadow: {
        card: "0 8px 22px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
