import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served under /app/ in production (nginx), proxies /api to Flask in dev.
export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
