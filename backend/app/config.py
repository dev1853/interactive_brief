# backend/app/config.py
import os
from dotenv import load_dotenv

# Загружает переменные из .env файла в окружение
load_dotenv()

# Читаем переменные из окружения
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

# Остальные настройки можно оставить здесь
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30