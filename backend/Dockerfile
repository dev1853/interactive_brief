# backend/Dockerfile

# 1. Используем официальный образ Python
FROM python:3.9-slim

# 2. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# 3. Копируем файл с зависимостями и устанавливаем их
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 4. Копируем все файлы приложения из папки 'app' в контейнер
COPY ./app /app/app

# 5. Указываем, что приложение будет работать на порту 8001
EXPOSE 8001

# 6. Команда для запуска приложения
# Запускаем через gunicorn для стабильной работы в продакшене
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "app.main:app", "--bind", "0.0.0.0:8001"]