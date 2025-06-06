# app/schemas.py
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

# --- User Schemas (НОВЫЕ) ---
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Имя пользователя")
    email: EmailStr = Field(..., description="Адрес электронной почты")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Пароль пользователя")

class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True # Позволяет ORM модели быть совместимой с Pydantic

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Схема для JWT токена
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- Question Schemas ---
class QuestionBase(BaseModel):
    text: str = Field(..., description="Текст вопроса")
    question_type: str = Field(..., description="Тип вопроса")
    options: Optional[List[str]] = None
    is_required: bool = False
    order: int
    conditional_logic: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionInDB(QuestionBase):
    id: int
    step_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        orm_mode = True

# --- Step Schemas ---
class StepBase(BaseModel):
    title: str
    order: int
    conditional_logic: Optional[Dict[str, Any]] = None

class StepCreate(StepBase):
    questions: Optional[List[QuestionCreate]] = []

class StepResponse(StepBase):
    id: int
    questions: List[QuestionInDB] = []
    class Config:
        orm_mode = True

# --- Brief Schemas ---
class BriefBase(BaseModel):
    title: str = Field(..., description="Название брифа")
    description: Optional[str] = None

class BriefCreate(BriefBase):
    steps: Optional[List[StepCreate]] = [] # Теперь бриф принимает шаги

class BriefUpdate(BriefCreate): # Теперь обновление тоже может менять всю структуру
    pass

class BriefResponse(BriefBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    steps: List[StepResponse] = [] # И возвращает шаги
    class Config:
        orm_mode = True

# --- UserAnswer Schemas ---
class UserAnswerData(BaseModel):
    answers_data: Dict[str, Any]

class UserAnswerCreate(UserAnswerData):
    brief_id: int
    session_id: str

class UserAnswerResponse(UserAnswerCreate):
    id: int
    submitted_at: datetime
    class Config:
        orm_mode = True

# --- Вспомогательные схемы ---
class MessageResponse(BaseModel):
    message: str

class FileUploadResponse(BaseModel):
    file_path: str