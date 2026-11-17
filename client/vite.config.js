import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0',
    port: 5001,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8081',
      '/ws': {
        target: 'http://localhost:8081',
        ws: true,
      },
    },
  },
})
