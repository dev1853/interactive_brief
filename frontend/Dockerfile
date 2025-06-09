# frontend/Dockerfile

# --- Этап 1: Сборка React-приложения ---
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# --- Этап 2: Настройка веб-сервера Nginx ---
FROM nginx:1.23-alpine

# Копируем собранные файлы из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
# Рекурсивно устанавливаем правильные права доступа для всех файлов,
# которые будет раздавать Nginx.
RUN chmod -R 755 /usr/share/nginx/html

# Копируем наш файл конфигурации для Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]