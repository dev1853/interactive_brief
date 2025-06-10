# backend/app/crud.py
from __future__ import annotations
import uuid
from typing import List, Union

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, Session

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
    Асинхронно создает новый бриф вместе со всеми вложенными шагами и вопросами.
    """
    # 1. Создаем основной объект брифа
    db_brief = models.Brief(
        title=brief.title,
        description=brief.description,
        owner_id=owner_id
    )
    db.add(db_brief)
    
    # Отправляем изменения в БД, чтобы получить ID брифа, но не завершаем транзакцию.
    await db.flush()

    # 2. Создаем шаги и вопросы в цикле, используя enumerate для порядка
    for step_index, step_data in enumerate(brief.steps):
        db_step = models.Step(
            title=step_data.title,
            description=step_data.description,
            brief_id=db_brief.id,
            order=step_index # Используем индекс из enumerate
        )
        db.add(db_step)
        await db.flush() # Получаем ID шага

        for question_index, question_data in enumerate(step_data.questions):
            db_question = models.Question(
                text=question_data.text,
                question_type=question_data.question_type,
                options=question_data.options,
                is_required=question_data.is_required,
                step_id=db_step.id,
                order=question_index # Используем индекс из enumerate
            )
            db.add(db_question)

    # 3. Завершаем транзакцию, сохраняя все изменения
    await db.commit()
    
    # 4. Загружаем и возвращаем полностью укомплектованный объект
    result = await db.execute(
        select(models.Brief).options(
            selectinload(models.Brief.steps).selectinload(models.Step.questions)
        ).filter(models.Brief.id == db_brief.id)
    )
    return result.scalars().one()

async def get_brief_by_id(db: AsyncSession, brief_id: int):
    """Асинхронное получение брифа по ID с его шагами и вопросами."""
    result = await db.execute(
        select(models.Brief).options(
            selectinload(models.Brief.steps).selectinload(models.Step.questions)
        ).filter(models.Brief.id == brief_id)
    )
    return result.scalars().first()

async def get_user_briefs(db: AsyncSession, user_id: int) -> List[models.Brief]:
    result = await db.execute(select(models.Brief).where(models.Brief.owner_id == user_id))
    return result.scalars().all()

async def get_main_brief(db: AsyncSession) -> Union[models.Brief, None]:
    first_user_res = await db.execute(select(models.User).limit(1))
    first_user = first_user_res.scalars().first()
    if not first_user: return None
    
    result = await db.execute(select(models.Brief).filter(models.Brief.owner_id == first_user.id, models.Brief.is_main == True))
    main_brief = result.scalars().first()
    if main_brief: return main_brief
    
    result = await db.execute(select(models.Brief).filter(models.Brief.owner_id == first_user.id).limit(1))
    return result.scalars().first()

async def update_brief(db: AsyncSession, brief_id: int, brief_update: schemas.BriefCreate) -> Union[models.Brief, None]:
    """
    Обновляет существующий бриф, полностью заменяя его шаги и вопросы.
    """
    # Находим существующий бриф в базе
    db_brief = await get_brief_by_id(db, brief_id=brief_id)
    if not db_brief:
        return None

    # 1. Обновляем простые поля (название, описание)
    db_brief.title = brief_update.title
    db_brief.description = brief_update.description

    # 2. Удаляем все старые шаги, связанные с этим брифом.
    # Это проще и надежнее, чем пытаться сопоставить старые и новые.
    # SQLAlchemy благодаря 'cascade="all, delete-orphan"' удалит и все связанные вопросы.
    # Для явного удаления в async-режиме, мы делаем это вручную:
    for step in db_brief.steps:
        await db.delete(step)
    await db.flush()
    db_brief.steps.clear()

    # 3. Создаем новые шаги и вопросы из полученных данных
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

    db.add(db_brief)
    await db.commit()
    await db.refresh(db_brief)
    return db_brief

async def set_main_brief(db: AsyncSession, brief_id: int, user_id: int):
    """
    Асинхронная установка брифа как главного для пользователя.
    Работает внутри уже существующей транзакции из get_db.
    """
    # Убираем 'async with db.begin():'

    # Снимаем флаг со всех брифов пользователя
    await db.execute(
        update(models.Brief)
        .where(models.Brief.owner_id == user_id)
        .values(is_main=False)
    )

    # Устанавливаем флаг для целевого брифа
    await db.execute(
        update(models.Brief)
        .where(models.Brief.id == brief_id, models.Brief.owner_id == user_id)
        .values(is_main=True)
    )

    # Так как get_db управляет транзакцией, здесь commit не нужен, 
    # он произойдет автоматически при выходе из `with` блока в get_db.
    # Однако, чтобы получить результат сразу, можно сделать flush.
    await db.flush()

    # Возвращаем обновленный бриф
    updated_brief = await get_brief_by_id(db, brief_id)
    return updated_brief


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
        select(models.Submission)
            .options(selectinload(models.Submission.brief)) # Явно подгружаем бриф
            .filter(models.Submission.brief_id == brief_id)
    )
    return result.scalars().all()

async def get_submission_by_session_id(db: AsyncSession, session_id: str):
    """Асинхронное получение ответа по ID сессии."""
    result = await db.execute(
        select(models.Submission)
            .options(selectinload(models.Submission.brief)) # Явно подгружаем бриф
            .filter(models.Submission.session_id == session_id)
    )
    return result.scalars().first()