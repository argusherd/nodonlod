const { addDynamicIconSelectors } = require("@iconify/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{pug,js,ts}", "./renderer/css/app.css"],
  plugins: [addDynamicIconSelectors()],
  theme: {
    extend: {},
  },
};
