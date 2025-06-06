# app/models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Step(Base):
    __tablename__ = "steps"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, default="Новый шаг")
    order = Column(Integer, nullable=False)
    brief_id = Column(Integer, ForeignKey("briefs.id"), nullable=False)
    brief = relationship("Brief", back_populates="steps")
    questions = relationship("Question", back_populates="step", cascade="all, delete-orphan", order_by="Question.order")
    conditional_logic = Column(JSON, nullable=True) # ЭТО НОВОЕ ПОЛЕ

class Brief(Base):
    __tablename__ = "briefs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Исправлено 'back_pop_ulates' на 'back_populates'
    steps = relationship("Step", back_populates="brief", cascade="all, delete-orphan", order_by="Step.order")
    user_answers = relationship("UserAnswer", back_populates="brief", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=False)
    text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)
    options = Column(JSON, nullable=True)
    is_required = Column(Boolean, default=False)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    conditional_logic = Column(JSON, nullable=True)
    # Исправлено 'back_pop_ulates' на 'back_populates'
    step = relationship("Step", back_populates="questions")

class UserAnswer(Base):
    __tablename__ = "user_answers"
    id = Column(Integer, primary_key=True, index=True)
    brief_id = Column(Integer, ForeignKey("briefs.id"), nullable=False) 
    session_id = Column(String, index=True, nullable=False)
    answers_data = Column(JSON, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    # Исправлено 'back_pop_ulates' на 'back_populates'
    brief = relationship("Brief", back_populates="user_answers")