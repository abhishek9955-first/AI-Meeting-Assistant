import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/process': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/scan-clue': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})