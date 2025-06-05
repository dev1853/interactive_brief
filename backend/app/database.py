# app/database.py

import os
# from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession # <-- УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ ЭТУ СТРОКУ
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession # Оставляем create_async_engine и AsyncSession
from sqlalchemy.orm import sessionmaker # <-- ДОБАВИТЬ ЭТУ СТРОКУ для sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env
load_dotenv()

# Получаем URL для подключения к базе данных из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL")

# Проверяем, что URL базы данных установлен
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please set it in your .env file.")

# Создаем асинхронный движок SQLAlchemy
# echo=True позволит нам видеть SQL-запросы в консоли, что полезно для отладки.
engine = create_async_engine(DATABASE_URL, echo=True)

# Создаем фабрику асинхронных сессий
# expire_on_commit=False предотвращает "отсоединение" объектов после коммита,
# что бывает полезно в асинхронных контекстах.
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession # class_=AsyncSession указывает на асинхронную сессию
)


# Базовый класс для наших декларативных моделей SQLAlchemy.
# Все наши модели базы данных будут наследовать от него.
Base = declarative_base()

# Вспомогательная функция для получения сессии базы данных
async def get_db():
    """
    Создает и предоставляет асинхронную сессию базы данных.
    Сессия автоматически закрывается после использования.
    """
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()