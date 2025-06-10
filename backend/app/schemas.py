# backend/app/schemas.py
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# --- Вопросы ---
class QuestionBase(BaseModel):
    text: str
    question_type: str
    options: Optional[List[str]] = None
    is_required: bool = False
    config: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    class Config:
        orm_mode = True

# --- Шаги ---
class StepBase(BaseModel):
    title: str
    description: Optional[str] = None

class StepCreate(StepBase):
    questions: List[QuestionCreate] = []

class Step(StepBase):
    id: int
    order: int
    questions: List[Question] = []
    class Config:
        orm_mode = True

# --- Брифы ---
class BriefBase(BaseModel):
    title: str
    description: Optional[str] = None

class BriefCreate(BriefBase):
    steps: List[StepCreate] = []

class Brief(BriefBase):
    id: int
    owner_id: int
    is_main: bool
    created_at: datetime
    steps: List[Step] = []
    class Config:
        orm_mode = True
        
# --- Ответы ---
class SubmissionBase(BaseModel):
    brief_id: int

class SubmissionCreate(SubmissionBase):
    answers: Dict[str, Any]

class Submission(SubmissionBase):
    id: int
    session_id: str
    created_at: datetime
    answers_data: Dict[str, Any]
    brief: Brief
    class Config:
        orm_mode = True

# --- Пользователи ---
class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    briefs: List[Brief] = []
    class Config:
        orm_mode = True

# --- Токены ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Обновление ссылок для вложенных схем
User.update_forward_refs()
Brief.update_forward_refs()