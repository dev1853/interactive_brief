# /backend/Dockerfile
FROM python:3.9-slim

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

EXPOSE 8001

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "app.main:app", "--bind", "0.0.0.0:8001"]