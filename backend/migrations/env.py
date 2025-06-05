# migrations/env.py

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

# Добавляем путь к корневой папке проекта в sys.path
# Это позволяет Python находить модули в папке 'app'
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from dotenv import load_dotenv

# Загружаем переменные окружения здесь
load_dotenv()

# Импортируем Base из нашего app.database
from app.database import Base

# Импортируем все наши модели, чтобы Alembic их видел
from app.models import *

# Импортируем context из Alembic. Он будет доступен через alembic.context
from alembic import context


# Interpret the config file for Python logging.
# This line sets up loggers basically.
# context.config - это объект конфигурации, который Alembic передает нам.
if context.config.config_file_name is not None:
    fileConfig(context.config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = context.config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL environment variable is not set.")

    # Если DATABASE_URL использует asyncpg, меняем его на psycopg2 или стандартный postgresql
    # Убедитесь, что psycopg2-binary установлен: pip install psycopg2-binary
    if url.startswith("postgresql+asyncpg://"):
        alembic_url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    else:
        alembic_url = url

    context.config.set_main_option("sqlalchemy.url", alembic_url) # Используем context.config здесь

    connectable = engine_from_config(
        context.config.get_section(context.config.config_ini_section, {}), # Используем context.config здесь
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=Base.metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()