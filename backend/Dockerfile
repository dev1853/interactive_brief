# backend/Dockerfile

# Используем официальный легковесный образ Python
FROM python:3.9-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Устанавливаем зависимости
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY ./app /app/app

# Копируем файлы для миграций
COPY ./migrations /app/migrations
COPY ./alembic.ini /app/alembic.ini

# --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
# Создаем папку для загрузок внутри контейнера
RUN mkdir uploads

# Указываем, что приложение будет работать на порту 8001
EXPOSE 8001

# Команда для запуска приложения
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "app.main:app", "--bind", "0.0.0.0:8001"]