from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Импортируем наши модули
from .database import init_db
from .routers import users, briefs, main_router

# СНАЧАЛА определяем функцию lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Выполняет код при старте приложения, например, инициализацию БД."""
    await init_db()
    yield

# ТЕПЕРЬ создаем приложение и передаем в него lifespan
app = FastAPI(
    title="Interactive Brief API",
    description="API для системы интерактивных брифов",
    version="1.0.0",
    openapi_version="3.1.0",
    lifespan=lifespan
)

# Настройка CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://brief.prismatica.agency",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение папки для загруженных файлов
app.mount("/uploads", StaticFiles(directory=Path("uploads")), name="uploads")

# Подключение всех роутеров
app.include_router(main_router.router)
app.include_router(users.router)
app.include_router(briefs.router)

# Корневой эндпоинт для проверки
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to the Interactive Brief API"}