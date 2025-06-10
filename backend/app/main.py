# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import main_router
from .database import SessionLocal
from . import crud, auth, schemas
from .config import settings

app = FastAPI(title="Interactive Briefs API")

# Настройка CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Порт по умолчанию для Vite/React
    "http://snova.dev",
    "https://snova.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    Выполняется при старте приложения.
    Создает администратора, если он не существует.
    """
    # Создаем сессию БД напрямую для стартового события
    async with SessionLocal() as db:
        # Проверяем и по email, и по имени пользователя
        admin_by_email = await crud.get_user_by_email(db, email=settings.ADMIN_EMAIL)
        admin_by_username = await crud.get_user_by_username(db, username=settings.ADMIN_USERNAME)

        # Создаем админа, только если его нет ни по email, ни по имени
        if not admin_by_email and not admin_by_username:
            hashed_password = auth.get_password_hash(settings.ADMIN_PASSWORD)
            await crud.create_user(
                db=db,
                user=schemas.UserCreate(
                    username=settings.ADMIN_USERNAME,
                    email=settings.ADMIN_EMAIL,
                    password=settings.ADMIN_PASSWORD,
                ),
                hashed_password=hashed_password
            )
            print("Admin user has been created.")
        else:
            print("Admin user already exists.")

# Подключаем роутеры
app.include_router(main_router.router)