/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        control: '12px',
        card: '16px',
        sheet: '24px',
      },
      boxShadow: {
        card: 'var(--suite-card-shadow)',
      },
      colors: {
        // Shared suite neutrals — CSS vars flip for day/night
        suite: {
          bg: 'rgb(var(--suite-bg) / <alpha-value>)',
          surface: 'rgb(var(--suite-surface) / <alpha-value>)',
          soft: 'rgb(var(--suite-soft) / <alpha-value>)',
          border: 'rgb(var(--suite-border) / <alpha-value>)',
          ink: 'rgb(var(--suite-ink) / <alpha-value>)',
          muted: 'rgb(var(--suite-muted) / <alpha-value>)',
          faint: 'rgb(var(--suite-faint) / <alpha-value>)',
        },
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
          rail: 'rgb(var(--admin-rail) / <alpha-value>)',
          'rail-ink': 'rgb(var(--admin-rail-ink) / <alpha-value>)',
          'rail-muted': 'rgb(var(--admin-rail-muted) / <alpha-value>)',
          'rail-border': 'rgb(var(--admin-rail-border) / <alpha-value>)',
          'rail-soft': 'rgb(var(--admin-rail-soft) / <alpha-value>)',
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
          bg: 'rgb(var(--suite-bg) / <alpha-value>)',
          surface: 'rgb(var(--suite-surface) / <alpha-value>)',
          soft: 'rgb(var(--suite-soft) / <alpha-value>)',
          border: 'rgb(var(--suite-border) / <alpha-value>)',
          ink: 'rgb(var(--suite-ink) / <alpha-value>)',
          muted: 'rgb(var(--suite-muted) / <alpha-value>)',
          faint: 'rgb(var(--suite-faint) / <alpha-value>)',
          brown: '#5b7c99',
          'brown-deep': '#456278',
          'brown-soft': 'rgb(var(--money-brown-soft) / <alpha-value>)',
          amber: '#c4923a',
          'amber-soft': 'rgb(var(--money-amber-soft) / <alpha-value>)',
          rose: '#b5493f',
          'rose-soft': 'rgb(var(--money-rose-soft) / <alpha-value>)',
          blue: '#4a7a9b',
          'blue-soft': 'rgb(var(--money-blue-soft) / <alpha-value>)',
          violet: '#6a5a94',
          'violet-soft': 'rgb(var(--money-violet-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        admin: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'admin-display': [
          '"Plus Jakarta Sans"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        money: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'money-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}