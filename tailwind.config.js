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
        },
        // Admin Panel — teal/slate (distinct from Roots green)
        admin: {
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf',
          '500': '#14b8a6',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
          '950': '#042f2e',
        },
        ink: {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
          '950': '#020617',
        },
        money: {
          bg: '#eef1f5',
          surface: '#ffffff',
          soft: '#f5f7fa',
          border: '#dde3ea',
          ink: '#243040',
          muted: '#5c6b7a',
          faint: '#8b98a6',
          // Accent soft steel-blue (tenang, beda dari Roots/Admin)
          brown: '#5b7c99',
          'brown-deep': '#456278',
          'brown-soft': '#e4ecf3',
          amber: '#c4923a',
          'amber-soft': '#f7ecd9',
          rose: '#b5493f',
          'rose-soft': '#f6e6e3',
          blue: '#4a7a9b',
          'blue-soft': '#e3edf3',
          violet: '#6a5a94',
          'violet-soft': '#ece8f4',
        },
      },
      fontFamily: {
        admin: ['"Sora"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'admin-display': ['"Fraunces"', 'Georgia', 'serif'],
        money: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'money-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}