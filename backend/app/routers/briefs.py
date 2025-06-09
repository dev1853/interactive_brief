# backend/app/routers/briefs.py
from __future__ import annotations
from typing import List
import uuid
import shutil
from pathlib import Path
import io

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


# Импортируем все необходимые модули из нашего приложения
from .. import crud, models, schemas, auth
from ..database import get_db

# Создаем роутер
router = APIRouter(
    prefix="/briefs",  # Все пути в этом файле будут начинаться с /briefs
    tags=["Briefs & Submissions"], # Группировка в документации Swagger
)

# Для загрузки файлов
UPLOAD_DIR = Path("uploads")


# --- Эндпоинты для Брифов ---

@router.get("/", response_model=List[schemas.Brief], summary="Получить все брифы текущего пользователя")
async def read_user_briefs_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return await crud.get_user_briefs(db=db, user_id=current_user.id)


@router.get("/{brief_id}", response_model=schemas.Brief, summary="Получить конкретный бриф по ID")
async def read_brief_endpoint(brief_id: int, db: AsyncSession = Depends(get_db)):
    db_brief = await crud.get_brief_by_id(db, brief_id=brief_id)
    if db_brief is None:
        raise HTTPException(status_code=404, detail="Brief not found")
    return db_brief


@router.post("/", response_model=schemas.Brief, status_code=status.HTTP_201_CREATED, summary="Создать новый бриф")
async def create_brief_endpoint(
    brief: schemas.BriefCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return await crud.create_brief(db=db, brief=brief, owner_id=current_user.id)


@router.put("/{brief_id}/set-main", response_model=schemas.Brief, summary="Назначить бриф главным")
async def set_main_brief_endpoint(
    brief_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    brief = await crud.get_brief_by_id(db, brief_id)
    if not brief or brief.owner_id != current_user.id:
         raise HTTPException(status_code=404, detail="Бриф не найден или не принадлежит вам")
    return await crud.set_main_brief(db, brief_id=brief_id, user_id=current_user.id)
    

@router.delete("/{brief_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить бриф")
async def delete_brief_endpoint(
    brief_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    brief = await crud.get_brief_by_id(db, brief_id=brief_id)
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")
    if brief.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brief")
    
    await crud.delete_brief(db, brief_id=brief_id)
    return


# --- Эндпоинты для Ответов (Submissions) ---

@router.post("/submissions", response_model=schemas.Submission)
async def create_submission_endpoint(submission: schemas.SubmissionCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_submission(db=db, submission=submission)

# ИСПРАВЛЕНО: функция стала async def
@router.get("/{brief_id}/submissions", response_model=List[schemas.Submission])
async def get_submissions_for_brief_endpoint(brief_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_submissions_by_brief_id(db, brief_id=brief_id)

@router.get("/submission/{session_id}", response_model=schemas.Submission)
async def get_submission_by_session_id_endpoint(session_id: str, db: AsyncSession = Depends(get_db)):
    submission = await crud.get_submission_by_session_id(db, session_id=session_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


# --- Эндпоинты для загрузки файлов и PDF ---

@router.post("/uploadfile", summary="Загрузить файл")
async def create_upload_file_endpoint(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    new_filename = f"{session_id}{file_extension}"
    file_location = UPLOAD_DIR / new_filename
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    return {"url": f"/uploads/{new_filename}"}


@router.get("/submissions/{session_id}/pdf", summary="Сгенерировать PDF-отчет")
async def generate_pdf_report_endpoint(session_id: str, db: AsyncSession = Depends(get_db)):
    submission = await crud.get_submission_by_session_id(db, session_id=session_id)

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    FONT_NAME = "DejaVuSans"
    # Убедитесь, что шрифт DejaVuSans.ttf находится в корневой папке вашего бэкенд-проекта
    if os.path.exists('DejaVuSans.ttf'):
        pdfmetrics.registerFont(TTFont(FONT_NAME, "DejaVuSans.ttf"))
    else:
        # Если шрифта нет, используем стандартный
        FONT_NAME = 'Helvetica'

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='MainTitle', fontName=FONT_NAME, fontSize=24, spaceAfter=20, alignment=1))
    styles.add(ParagraphStyle(name='SubTitle', fontName=FONT_NAME, fontSize=14, spaceAfter=20, alignment=1))
    styles.add(ParagraphStyle(name='Question', fontName=FONT_NAME, fontSize=12, spaceBefore=10, spaceAfter=6, textColor=colors.darkblue))
    styles.add(ParagraphStyle(name='Answer', fontName=FONT_NAME, fontSize=11, leading=14))

    story = []
    
    # ... (остальная логика генерации PDF)

    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        canvas.setFont(FONT_NAME, 9)
        canvas.drawRightString(letter[0] - inch, 0.75 * inch, f"Страница {page_num}")

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=report_{session_id}.pdf"})