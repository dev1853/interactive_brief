# backend/app/models.py
from sqlalchemy import (Column, Integer, String, Text, Boolean, DateTime,
                        ForeignKey, JSON)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Brief(Base):
    __tablename__ = "briefs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_main = Column(Boolean, default=False, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="briefs")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    steps = relationship("Step", back_populates="brief", cascade="all, delete-orphan", lazy="selectin", order_by="Step.order")
    submissions = relationship("Submission", back_populates="brief", cascade="all, delete-orphan", lazy="selectin")

class Step(Base):
    __tablename__ = "steps"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, default="Новый шаг")
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    brief_id = Column(Integer, ForeignKey("briefs.id"), nullable=False)
    
    brief = relationship("Brief", back_populates="steps")
    questions = relationship("Question", back_populates="step", cascade="all, delete-orphan", lazy="selectin", order_by="Question.order")
    conditional_logic = Column(JSON, nullable=True)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=False)
    text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)
    options = Column(JSON, nullable=True)
    is_required = Column(Boolean, default=False)
    order = Column(Integer, nullable=False)
    conditional_logic = Column(JSON, nullable=True)
    
    step = relationship("Step", back_populates="questions")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    brief_id = Column(Integer, ForeignKey("briefs.id"), nullable=False)
    session_id = Column(String, index=True, nullable=False)
    answers_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    brief = relationship("Brief", back_populates="submissions")