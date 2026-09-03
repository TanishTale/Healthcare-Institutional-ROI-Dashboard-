/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        sidebar: "#0f172a",
        card: "#ffffff",
        border: "#e2e8f0",
        // Status colors strictly reserved for profit/loss/warning statuses
        status: {
          profit: "#10b981", // Emerald 500
          "profit-bg": "#ecfdf5", // Emerald 50
          "profit-border": "#a7f3d0", // Emerald 200
          loss: "#ef4444", // Red 500
          "loss-bg": "#fef2f2", // Red 50
          "loss-border": "#fecaca", // Red 200
          warning: "#f59e0b", // Amber 500
          "warning-bg": "#fffbeb", // Amber 50
          "warning-border": "#fde68a", // Amber 200
        }
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
};
