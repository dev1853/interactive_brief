# backend/app/main.py

import os
import uuid
import shutil
import io
from pathlib import Path
from datetime import datetime, timedelta # НОВОЕ: для JWT
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # НОВОЕ: для OAuth2
from sqlalchemy.ext.asyncio import AsyncSession
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

# НОВОЕ: для хеширования паролей и JWT
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.database import get_db
from app import models, schemas

# --- КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ ---
# ВАЖНО: Замените это на реальный, длинный, случайный секретный ключ!
# python -c 'import os; print(os.urandom(24).hex())'
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-replace-me") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Время жизни токена в минутах

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- ФУНКЦИИ БЕЗОПАСНОСТИ ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalars().first()

async def get_current_user(db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# --- НАСТРОЙКА FastAPI ---
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

# --- ЭНДПОИНТЫ АУТЕНТИФИКАЦИИ (НОВЫЕ) ---

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_create: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user_email = await get_user_by_email(db, email=user_create.email)
    if db_user_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    db_user_username = await get_user_by_username(db, username=user_create.username)
    if db_user_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    hashed_password = get_password_hash(user_create.password)
    db_user = models.User(username=user_create.username, email=user_create.email, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, username=form_data.username) # Ищем по username
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- ЭНДПОИНТЫ ЗАГРУЗКИ ФАЙЛОВ ---
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

# --- ОБНОВЛЕННЫЕ ЭНДПОИНТЫ ДЛЯ БРИФОВ (ТРЕБУЕТСЯ ЗАЩИТА) ---

# ВРЕМЕННО: Оставим без Depends(get_current_user) для тестирования
# После реализации аутентификации на фронтенде, нужно будет добавить
# current_user: models.User = Depends(get_current_user)
# и использовать current_user.id для owner_id

@app.post("/briefs/", response_model=schemas.BriefResponse, status_code=status.HTTP_201_CREATED)
async def create_brief(brief: schemas.BriefCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)): # НОВОЕ: Добавляем зависимость
    db_brief = models.Brief(title=brief.title, description=brief.description, owner_id=current_user.id) # НОВОЕ: Привязываем к пользователю
    if brief.steps:
        for step_data in brief.steps:
            db_step = models.Step(
                title=step_data.title,
                order=step_data.order,
                conditional_logic=step_data.conditional_logic
            )
            if step_data.questions:
                db_step.questions = []
                for q_data in step_data.questions:
                    db_question = models.Question(
                        text=q_data.text,
                        question_type=q_data.question_type,
                        options=q_data.options,
                        is_required=q_data.is_required,
                        order=q_data.order,
                        conditional_logic=q_data.conditional_logic
                    )
                    db_step.questions.append(db_question)
            db_brief.steps.append(db_step)
    db.add(db_brief)
    await db.commit()
    await db.refresh(db_brief)
    
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == db_brief.id)
        .options(
            selectinload(models.Brief.steps).selectinload(models.Step.questions)
        )
    )
    return result.scalars().first()

# Изменен: Теперь получаем только брифы текущего пользователя
@app.get("/briefs/", response_model=List[schemas.BriefResponse])
async def get_all_briefs(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)): # НОВОЕ: Защита
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.owner_id == current_user.id) # НОВОЕ: Фильтрация по владельцу
        .options(selectinload(models.Brief.steps).selectinload(models.Step.questions))
        .order_by(models.Brief.created_at.desc())
    )
    return result.scalars().all()

@app.get("/briefs/{brief_id}", response_model=schemas.BriefResponse)
async def get_brief(brief_id: int, db: AsyncSession = Depends(get_db)): # НОВОЕ: Будем проверять owner_id здесь, но пока оставим без Depends
    # Пока не добавляем защиту get_current_user, чтобы можно было заполнять брифы без логина.
    # Для /admin, бриф должен быть доступен только владельцу.
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
async def update_brief(brief_id: int, brief_data: schemas.BriefCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)): # НОВОЕ: Защита
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == brief_id, models.Brief.owner_id == current_user.id) # НОВОЕ: Проверка владельца
        .options(selectinload(models.Brief.steps))
    )
    db_brief = result.scalars().first()

    if not db_brief:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф для обновления не найден или у вас нет прав.")

    db_brief.title = brief_data.title
    db_brief.description = brief_data.description

    for step in db_brief.steps:
        await db.delete(step)
    
    new_steps = []
    if brief_data.steps:
        for step_data in brief_data.steps:
            db_step = models.Step(
                title=step_data.title,
                order=step_data.order,
                conditional_logic=step_data.conditional_logic
            )
            if step_data.questions:
                db_step.questions = []
                for q_data in step_data.questions:
                    db_question = models.Question(
                        text=q_data.text,
                        question_type=q_data.question_type,
                        options=q_data.options,
                        is_required=q_data.is_required,
                        order=q_data.order,
                        conditional_logic=q_data.conditional_logic
                    )
                    db_step.questions.append(db_question)
            new_steps.append(db_step)
            
    db_brief.steps = new_steps
    
    await db.commit()
    await db.refresh(db_brief)
    
    result = await db.execute(
        select(models.Brief)
        .where(models.Brief.id == brief_id)
        .options(selectinload(models.Brief.steps).selectinload(models.Step.questions))
    )
    updated_brief = result.scalars().first()

    return updated_brief

@app.delete("/briefs/{brief_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brief(brief_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)): # НОВОЕ: Защита
    result = await db.execute(select(models.Brief).where(models.Brief.id == brief_id, models.Brief.owner_id == current_user.id)) # НОВОЕ: Проверка владельца
    brief_to_delete = result.scalars().first()
    if not brief_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф для удаления не найден или у вас нет прав.")
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
async def get_brief_answers(brief_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)): # НОВОЕ: Защита
    # Убедимся, что пользователь может видеть ответы только на свои брифы
    brief_result = await db.execute(select(models.Brief).where(models.Brief.id == brief_id, models.Brief.owner_id == current_user.id))
    brief_exists = brief_result.scalars().first()
    if not brief_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бриф не найден или у вас нет прав для просмотра ответов.")

    result = await db.execute(select(models.UserAnswer).where(models.UserAnswer.brief_id == brief_id).order_by(models.UserAnswer.submitted_at.desc()))
    return result.scalars().all()

@app.get("/submission/{session_id}/pdf")
async def generate_submission_pdf(session_id: str, db: AsyncSession = Depends(get_db)): # НОВОЕ: Может быть защищен позже
    result = await db.execute(select(models.UserAnswer).where(models.UserAnswer.session_id == session_id).options(selectinload(models.UserAnswer.brief).selectinload(models.Brief.steps).selectinload(models.Step.questions)))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Сессия с ответами не найдена.")
    
    # Можно добавить проверку владения брифом, если current_user доступен
    # if submission.brief.owner_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="У вас нет прав для доступа к этому отчету.")


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