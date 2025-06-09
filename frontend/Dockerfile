# frontend/Dockerfile

# --- Этап 1: Сборка React-приложения ---
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# --- Этап 2: Настройка веб-сервера Nginx ---
FROM nginx:1.21-alpine

# Копируем собранные файлы из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем наш файл конфигурации для Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Указываем, что сервер будет слушать порт 80
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]