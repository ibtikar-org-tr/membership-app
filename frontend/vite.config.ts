import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    base: env.VITE_BASE_PATH || '/mf/membership-app/',
    build: {
      outDir: `dist${env.VITE_BASE_PATH || '/mf/membership-app/'}`
    }
  }
})
