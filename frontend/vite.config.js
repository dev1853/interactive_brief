// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Эта настройка позволяет запускать dev-сервер, 
    // доступный из локальной сети, что полезно для тестов.
    host: '0.0.0.0', 
    port: 5173,
  },
  preview: {
    // Эта настройка отвечает за команду `npm run preview`
    host: '0.0.0.0',
    port: 4173,
    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Явно разрешаем доступ с вашего домена
    strictPort: true,
    proxy: {
        '/api': {
            target: 'http://backend:8001',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
        },
    }
  }
})