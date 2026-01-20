/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        handwriting: ['Kalam', 'cursive'],
        chinese: ['Ma Shan Zheng', 'Zhi Mang Xing', 'cursive'],
      },
      colors: {
        chacha: {
          bg: '#fdfcf8',
          text: '#5c4d43',
          accent: '#e6ddd0',
          border: '#e6dec8',
        }
      },
    },
  },
  plugins: [],
}
