/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. Palet Hijau untuk Tombol & Aksi
        primary: {
          '50': '#f1f7f1',
          '100': '#e2efe2',
          '200': '#c9e1c9',
          '300': '#aed3ae',
          '400': '#90c190',
          '500': '#6AA86A', // <- Warna utama Anda
          '600': '#559455', // <- Bagus untuk hover
          '700': '#437943',
          '800': '#356035',
          '900': '#2a4e2a',
          '950': '#182c18',
        },
        // 2. Palet Abu-Biru Gelap untuk Teks
        brand: {
          '50': '#f5f6f7',
          '100': '#e6e9eb',
          '200': '#ced5da',
          '300': '#aeb8c2',
          '400': '#8a99a7',
          '500': '#6d7f8f',
          '600': '#566776',
          '700': '#3D4752', // <- Warna teks utama Anda
          '800': '#313941',
          '900': '#2a3036',
          '950': '#1c2024',
        },

        secondary: {
          '100': '#F3EEF8', 
          '500': '#A485D1', 
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}