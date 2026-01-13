/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ea4c94',
          light: '#f06aa8',
          dark: '#d43d82',
        },
        secondary: {
          DEFAULT: '#ea6969',
          light: '#f08080',
        },
      },
    },
  },
  plugins: [],
};
