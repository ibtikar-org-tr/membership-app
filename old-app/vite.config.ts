import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import ssrPlugin from "vite-ssr-components/plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    cloudflare({
      experimental: { remoteBindings: true },
      tsconfig: "tsconfig.worker.json"
    }),
    tailwindcss(),
    ssrPlugin(),
    react()
  ],
  build: {
    manifest: true
  }
})
