# app/schemas.py
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

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

# --- Step Schemas (НОВЫЕ) ---
class StepBase(BaseModel):
    title: str
    order: int

class StepCreate(StepBase):
    questions: Optional[List[QuestionCreate]] = []

class StepResponse(StepBase):
    id: int
    questions: List[QuestionInDB] = []
    class Config:
        orm_mode = True

# --- Brief Schemas (ОБНОВЛЕННЫЕ) ---
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

# --- UserAnswer Schemas (без изменений) ---
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

# --- Вспомогательные схемы (без изменений) ---
class MessageResponse(BaseModel):
    message: str

class FileUploadResponse(BaseModel):
    file_path: str