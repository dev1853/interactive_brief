# frontend/Dockerfile (НОВАЯ ВЕРСИЯ)

# Используем только легковесный образ Nginx
FROM nginx:1.23-alpine

# Копируем УЖЕ СОБРАННЫЕ файлы из локальной папки 'dist'
# Эта папка должна быть создана командой 'npm run build' на вашем компьютере
COPY ./dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Устанавливаем правильные права доступа
RUN chmod -R o+r /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]