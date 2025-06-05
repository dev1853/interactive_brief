# app/main.py

import os
import uuid
import shutil
import io
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.database import get_db
from app import models, schemas

# --- НАСТРОЙКА ---
ROOT_DIR = Path(__file__).resolve().parent.parent
app = FastAPI(title="Интерактивный Бриф API")

# --- CORS ---
origins = ["http://localhost", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- СТАТИЧЕСКИЕ ФАЙЛЫ И ШРИФТЫ ---
Path("uploads").mkdir(exist_ok=True)
Path("static").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

FONT_NAME = 'Helvetica'
try:
    font_path = ROOT_DIR / 'DejaVuSans.ttf'
    if font_path.exists():
        pdfmetrics.registerFont(TTFont('DejaVuSans', str(font_path)))
        FONT_NAME = 'DejaVuSans'
    else:
        print("ПРЕДУПРЕЖДЕНИЕ: Шрифт DejaVuSans.ttf не найден.")
except Exception as e:
    print(f"Ошибка регистрации шрифта: {e}")

# --- ЭНДПОИНТЫ ---

@app.post("/upload", response_model=schemas.FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf", "application/zip", "image/gif"]
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Недопустимый тип файла: {file.content_type}")
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    save_path = Path("uploads") / unique_filename
    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    return {"file_path": f"/uploads/{unique_filename}"}

# --- ОБНОВЛЕННЫЕ ЭНДПОИНТЫ ДЛЯ БРИФОВ ---

@app.post("/briefs/", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_brief(brief: schemas.BriefCreate, db: AsyncSession = Depends(get_db)):
    db_brief = models.Brief(title=brief.title, description=brief.description)
    if brief.steps:
        for step_data in brief.steps:
            db_step = models.Step(title=step_data.title, order=step_data.order)
            if step_data.questions:
                db_step.questions = [models.Question(**q.dict()) for q in step_data.questions]
            db_brief.steps.append(db_step)
    db.add(db_brief)
    await db.commit()
    await db.refresh(db_brief)
    return schemas.MessageResponse(message=f"Бриф '{brief.title}' успешно создан. ID: {db_brief.id}")

@app.get("/briefs/", response_model=List[schemas.BriefResponse])
async def get_all_briefs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Brief)
        .options(selectinload(models.Brief.steps).selectinload(models.Step.questions))
        .order_by(models.Brief.created_at.desc())
    )
    return result.scalars().all()

@app.get("/briefs/{brief_id}", response_model=schemas.BriefResponse)
async def get_brief(brief_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == brief_id)
        .options(selectinload(models.Brief.steps).selectinload(models.Step.questions))
    )
    brief = result.scalars().first()
    if not brief:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф не найден")
    return brief

@app.put("/briefs/{brief_id}", response_model=schemas.BriefResponse)
async def update_brief(brief_id: int, brief_data: schemas.BriefCreate, db: AsyncSession = Depends(get_db)):
    """
    Полностью обновляет бриф, включая название, описание и весь список шагов с вопросами.
    """
    # Находим бриф, который нужно обновить, и сразу загружаем связанные с ним шаги
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == brief_id)
        .options(selectinload(models.Brief.steps))
    )
    db_brief = result.scalars().first()

    if not db_brief:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф для обновления не найден")

    # Обновляем простые поля: название и описание
    db_brief.title = brief_data.title
    db_brief.description = brief_data.description

    # Используем стратегию "удалить старые, создать новые" для шагов и вопросов
    # Это самый надежный способ полного обновления.
    
    # Сначала удаляем все старые шаги (вопросы удалятся каскадно)
    for step in db_brief.steps:
        await db.delete(step)
    
    # Создаем новые шаги и вопросы из данных, пришедших в запросе
    new_steps = []
    if brief_data.steps:
        for step_data in brief_data.steps:
            db_step = models.Step(title=step_data.title, order=step_data.order)
            if step_data.questions:
                db_step.questions = [models.Question(**q.dict()) for q in step_data.questions]
            new_steps.append(db_step)
            
    db_brief.steps = new_steps
    
    # Сохраняем все изменения в базе данных
    await db.commit()
    await db.refresh(db_brief)
    
    # Для корректного ответа загружаем обновленные данные с вложенностью
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == brief_id)
        .options(selectinload(models.Brief.steps).selectinload(models.Step.questions))
    )
    updated_brief = result.scalars().first()

    return updated_brief

@app.delete("/briefs/{brief_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brief(brief_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Brief).where(models.Brief.id == brief_id))
    brief_to_delete = result.scalars().first()
    if not brief_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф для удаления не найден")
    await db.delete(brief_to_delete)
    await db.commit()
    return

# --- ОСТАЛЬНЫЕ ЭНДПОИНТЫ ---

@app.post("/submit_answers/", response_model=schemas.UserAnswerResponse, status_code=status.HTTP_201_CREATED)
async def submit_answers(answers: schemas.UserAnswerCreate, db: AsyncSession = Depends(get_db)):
    db_answers = models.UserAnswer(**answers.dict())
    db.add(db_answers)
    await db.commit()
    await db.refresh(db_answers)
    return db_answers

@app.get("/answers/{brief_id}", response_model=List[schemas.UserAnswerResponse])
async def get_brief_answers(brief_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.UserAnswer).where(models.UserAnswer.brief_id == brief_id).order_by(models.UserAnswer.submitted_at.desc()))
    return result.scalars().all()

@app.get("/submission/{session_id}/pdf")
async def generate_submission_pdf(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.UserAnswer).where(models.UserAnswer.session_id == session_id).options(selectinload(models.UserAnswer.brief).selectinload(models.Brief.steps).selectinload(models.Step.questions)))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Сессия с ответами не найдена.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=inch, rightMargin=inch, topMargin=inch, bottomMargin=inch)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='MainTitle', parent=styles['h1'], fontName=FONT_NAME, fontSize=18, spaceAfter=14))
    styles.add(ParagraphStyle(name='SubTitle', parent=styles['h2'], fontName=FONT_NAME, fontSize=12, textColor=colors.grey, spaceAfter=24))
    styles.add(ParagraphStyle(name='Question', parent=styles['Normal'], fontName=FONT_NAME, fontSize=12, spaceAfter=6, textColor=colors.darkblue))
    styles.add(ParagraphStyle(name='Answer', parent=styles['Normal'], fontName=FONT_NAME, fontSize=11, leftIndent=18, spaceAfter=18))
    
    story = []
    logo_path = ROOT_DIR / "static" / "logo.png"
    if logo_path.exists():
        logo = Image(logo_path, width=inch, height=inch)
        logo.hAlign = 'RIGHT'
        story.append(logo)
        story.append(Spacer(1, -0.5 * inch))

    story.append(Paragraph(f"Отчет по брифу: {submission.brief.title}", styles['MainTitle']))
    story.append(Paragraph(f"ID Сессии: {session_id}", styles['SubTitle']))

    all_questions = {q.id: q.text for step in submission.brief.steps for q in step.questions}
    for question_id_str, answer_value in submission.answers_data.items():
        question_text = all_questions.get(int(question_id_str), "Неизвестный вопрос")
        story.append(Paragraph(f"В: {question_text}", styles['Question']))
        answer_text = ""
        if isinstance(answer_value, list):
            list_items = "".join([f"<li>{item.get('name') if isinstance(item, dict) else str(item)}</li>" for item in answer_value])
            answer_text = f"<ul>{list_items}</ul>"
        else:
            answer_text = str(answer_value)
        story.append(Paragraph(answer_text, styles['Answer']))

    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        canvas.setFont(FONT_NAME, 9)
        canvas.drawRightString(letter[0] - inch, 0.75 * inch, f"Страница {page_num}")

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type='application/pdf', headers={'Content-Disposition': f'attachment; filename="brief_report_{session_id}.pdf"'})

@app.on_event("startup")
async def startup_event():
    pass