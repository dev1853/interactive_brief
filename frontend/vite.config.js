// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Позволяет принимать запросы с любого сетевого хоста,
    // а не только localhost. Полезно для работы в Docker.
    host: true,
  },
  preview: {
    host: true,
    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Явно разрешаем доступ с вашего домена
    allowedHosts: [
      'brief.prismatica.agency'
    ],
  }
})