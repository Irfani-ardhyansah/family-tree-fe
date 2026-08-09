import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path' // <-- 1. Impor 'path'

/** Vite requires a trailing slash for non-root bases (e.g. `/family/`). */
function normalizeBase(raw?: string): string {
  if (!raw || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // From .env VITE_BASE_PATH — local `/`, Docker build arg `/family/`
    base: normalizeBase(process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH),
    plugins: [react()],
    resolve: { // <-- 2. Tambahkan seluruh blok 'resolve' ini
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
