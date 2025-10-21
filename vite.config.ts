import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path' // <-- 1. Impor 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // <-- 2. Tambahkan seluruh blok 'resolve' ini
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})