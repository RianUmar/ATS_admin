import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, // Listen on 0.0.0.0 for Docker container support
    port: 5173,
    watch: {
      usePolling: true, // Memastikan Hot Module Reload (HMR) berjalan mulus di Docker
    }
  }
})
