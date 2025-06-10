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

async def get_user_by_username(db: AsyncSession, username: str) -> Union[models.User, None]:
    """Асинхронно получает пользователя по имени пользователя."""
    result = await db.execute(select(models.User).filter(models.User.username == username))
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

async def get_user_briefs(db: AsyncSession, user_id: int) -> List[models.Brief]:
    """Асинхронно получает все брифы для конкретного пользователя с их вопросами."""
    query = (
        select(models.Brief)
        .options(selectinload(models.Brief.questions))  # Жадная загрузка вопросов
        .filter(models.Brief.owner_id == user_id)
    )
    result = await db.execute(query)
    return result.scalars().all()

async def get_brief_by_id(db: AsyncSession, brief_id: int) -> Union[models.Brief, None]:
    """Асинхронно получает бриф по его ID с его вопросами."""
    query = (
        select(models.Brief)
        .options(selectinload(models.Brief.questions))  # Жадная загрузка вопросов
        .where(models.Brief.id == brief_id)
    )
    result = await db.execute(query)
    return result.scalars().first()

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
                questions=[
                    models.Question(
                        text=q_data.text,
                        question_type=q_data.question_type,
                        options=q_data.options
                    ) for q_data in step_data.questions
                ]
            ) for step_data in brief.steps
        ]
    )
    db.add(db_brief)
    await db.commit()
    await db.refresh(db_brief)
    return db_brief

async def update_brief(db: AsyncSession, brief_id: int, brief_update: schemas.BriefCreate, owner_id: int) -> models.Brief | None:
    """Асинхронное обновление брифа."""
    db_brief = await get_brief_by_id(db, brief_id)
    if not db_brief or db_brief.owner_id != owner_id:
        return None

    # Простое обновление полей
    db_brief.title = brief_update.title
    db_brief.description = brief_update.description
    
    # Удаление старых шагов и вопросов
    for step in db_brief.steps:
        await db.delete(step)
    await db.flush()

    # Добавление новых шагов и вопросов
    new_steps = []
    for step_data in brief_update.steps:
        new_step = models.Step(title=step_data.title, description=step_data.description, brief_id=brief_id)
        new_questions = []
        for q_data in step_data.questions:
            new_question = models.Question(text=q_data.text, question_type=q_data.question_type, options=q_data.options, step=new_step)
            new_questions.append(new_question)
        new_step.questions = new_questions
        new_steps.append(new_step)
    
    db_brief.steps = new_steps

    await db.commit()
    await db.refresh(db_brief)
    return db_brief

async def delete_brief(db: AsyncSession, brief_id: int, owner_id: int):
    """Асинхронное удаление брифа."""
    db_brief = await db.execute(
        select(models.Brief).where(models.Brief.id == brief_id, models.Brief.owner_id == owner_id)
    )
    db_brief = db_brief.scalars().first()
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