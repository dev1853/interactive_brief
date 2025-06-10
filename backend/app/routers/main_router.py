# backend/app/routers/main_router.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .. import crud, schemas
from ..database import get_db

router = APIRouter(tags=["Main"])

@router.get("/main-brief", response_model=schemas.Brief)
async def get_main_brief_endpoint(db: AsyncSession = Depends(get_db)):
    main_brief = await crud.get_main_brief(db)
    if not main_brief:
        raise HTTPException(status_code=404, detail="Главный бриф не найден.")
    return main_brief