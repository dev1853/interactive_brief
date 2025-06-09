# backend/app/routers/main_router.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    tags=["Main"],
)

@router.get("/main-brief", response_model=schemas.Brief, summary="Получить главный публичный бриф")
async def get_main_brief_endpoint(db: AsyncSession = Depends(get_db)):
    """
    Возвращает бриф, который назначен главным.
    Если главный бриф не назначен, он вернет первый попавшийся,
    чтобы главная страница не была пустой.
    """
    main_brief = await crud.get_main_brief(db)
    if not main_brief:
        raise HTTPException(status_code=404, detail="В системе нет ни одного брифа.")
    return main_brief