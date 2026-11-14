/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fox: {
          orange: '#FF7A30',
          darkOrange: '#E45E15',
          cream: '#FFF5EB',
          charcoal: '#22252A',
          bg: '#FAFAF9',
          border: '#E5E5E3',
        }
      }
    },
  },
  plugins: [],
}
