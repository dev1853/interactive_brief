# /frontend/Dockerfile

# --- Этап 1: Сборка React-приложения ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Этап 2: Настройка веб-сервера Nginx ---
FROM nginx:1.23-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]