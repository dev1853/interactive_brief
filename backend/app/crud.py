# backend/app/crud.py
from __future__ import annotations
import uuid
from typing import List, Union

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from . import models, schemas

# --- CRUD для Пользователей ---

async def get_user_by_email(db: AsyncSession, email: str) -> Union[models.User, None]:
    """Асинхронно получает пользователя по email."""
    result = await db.execute(select(models.User).filter(models.User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate, hashed_password: str) -> models.User:
    """Создает пользователя, принимая уже хешированный пароль."""
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# --- CRUD для Брифов ---

async def create_brief(db: AsyncSession, brief: schemas.BriefCreate, owner_id: int) -> models.Brief:
    """
    Создает бриф со всеми вложенными шагами и вопросами единым, правильным способом.
    """
    db_brief = models.Brief(
        title=brief.title,
        description=brief.description,
        owner_id=owner_id,
        steps=[
            models.Step(
                title=step_data.title,
                description=step_data.description,
                order=step_index,
                questions=[
                    models.Question(
                        text=question_data.text,
                        question_type=question_data.question_type,
                        options=question_data.options,
                        is_required=question_data.is_required,
                        order=question_index
                    ) for question_index, question_data in enumerate(step_data.questions)
                ]
            ) for step_index, step_data in enumerate(brief.steps)
        ]
    )
    db.add(db_brief)
    await db.commit()
    await db.refresh(db_brief)
    return db_brief

async def update_brief(db: AsyncSession, brief_id: int, brief_update: schemas.BriefCreate) -> Union[models.Brief, None]:
    """
    Обновляет существующий бриф, полностью заменяя его шаги и вопросы.
    """
    result = await db.execute(select(models.Brief).filter(models.Brief.id == brief_id))
    db_brief = result.scalars().first()
    if not db_brief:
        return None

    # 1. Обновляем простые поля
    db_brief.title = brief_update.title
    db_brief.description = brief_update.description

    # 2. Очищаем старые шаги (cascade в models.py удалит связанные вопросы)
    db_brief.steps.clear()
    await db.flush()

    # 3. Добавляем новые шаги и вопросы
    for step_index, step_data in enumerate(brief_update.steps):
        new_step = models.Step(
            title=step_data.title,
            description=step_data.description,
            order=step_index,
            questions=[
                models.Question(
                    text=q.text,
                    question_type=q.question_type,
                    options=q.options,
                    is_required=q.is_required,
                    order=q_idx
                ) for q_idx, q in enumerate(step_data.questions)
            ]
        )
        db_brief.steps.append(new_step)

    await db.commit()
    await db.refresh(db_brief)
    return db_brief

async def get_brief_by_id(db: AsyncSession, brief_id: int) -> Union[models.Brief, None]:
    """Асинхронно получает бриф по его ID."""
    query = (
        select(models.Brief)
        .options(selectinload(models.Brief.questions)) # <-- ДОБАВЛЕНО
        .where(models.Brief.id == brief_id)
    )
    result = await db.execute(query)
    return result.scalars().first()

async def get_user_briefs(db: AsyncSession, user_id: int) -> List[models.Brief]:
    """Асинхронно получает все брифы для конкретного пользователя."""
    query = (
        select(models.Brief)
        .options(selectinload(models.Brief.questions)) # <-- ДОБАВЛЕНО
        .filter(models.Brief.owner_id == user_id)
    )
    result = await db.execute(query)
    return result.scalars().all()

async def get_main_brief(db: AsyncSession) -> Union[models.Brief, None]:
    """Асинхронно находит главный бриф."""
    first_user_res = await db.execute(select(models.User).limit(1))
    first_user = first_user_res.scalars().first()
    if not first_user: return None
    
    result = await db.execute(
        select(models.Brief).filter(models.Brief.owner_id == first_user.id, models.Brief.is_main == True)
    )
    main_brief = result.scalars().first()
    if main_brief: return main_brief
    
    result = await db.execute(select(models.Brief).filter(models.Brief.owner_id == first_user.id).limit(1))
    return result.scalars().first()

async def set_main_brief(db: AsyncSession, brief_id: int, user_id: int):
    """Асинхронная установка брифа как главного для пользователя."""
    await db.execute(
        update(models.Brief).where(models.Brief.owner_id == user_id).values(is_main=False)
    )
    await db.execute(
        update(models.Brief).where(models.Brief.id == brief_id, models.Brief.owner_id == user_id).values(is_main=True)
    )
    await db.commit()
    return await get_brief_by_id(db, brief_id)

async def delete_brief(db: AsyncSession, brief_id: int):
    """Асинхронное удаление брифа."""
    db_brief = await get_brief_by_id(db, brief_id)
    if db_brief:
        await db.delete(db_brief)
        await db.commit()
    return db_brief

# --- CRUD для Ответов (Submissions) ---

async def create_submission(db: AsyncSession, submission: schemas.SubmissionCreate):
    """Асинхронное создание ответа."""
    session_id = str(uuid.uuid4())
    db_submission = models.Submission(
        brief_id=submission.brief_id, 
        session_id=session_id,
        answers_data=submission.answers
    )
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

async def get_submissions_by_brief_id(db: AsyncSession, brief_id: int):
    """Асинхронное получение всех ответов для брифа."""
    result = await db.execute(
        select(models.Submission).filter(models.Submission.brief_id == brief_id)
    )
    return result.scalars().all()

async def get_submission_by_session_id(db: AsyncSession, session_id: str):
    """Асинхронное получение ответа по ID сессии."""
    result = await db.execute(
        select(models.Submission).filter(models.Submission.session_id == session_id)
    )
    return result.scalars().first()