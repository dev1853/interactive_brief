# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from . import config

engine = create_async_engine(config.DATABASE_URL)

# Наш создатель сессий называется AsyncSessionLocal
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Эта функция - единственный правильный способ получать сессию в эндпоинтах
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)