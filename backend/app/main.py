# backend/app/main.py
from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import init_db
from .routers import users, briefs, main_router # Импорт всех трех

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://brief.prismatica.agency", # Ваш домен
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=Path("uploads")), name="uploads")

app.include_router(main_router.router)
app.include_router(users.router)
app.include_router(briefs.router)

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to the Interactive Brief API"}