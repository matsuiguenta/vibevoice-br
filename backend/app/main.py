"""
VibeVoice BR — Main Application
FastAPI server com VibeVoice TTS, ASR Whisper, e painel admin
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.vibevoice_engine import get_vibevoice_engine
from app.core.asr_engine import get_asr_engine
from app.routers import tts, asr, auth, admin
from app.models import user, job


# ─── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização e shutdown dos modelos de IA."""
    logger.info("🚀 Iniciando VibeVoice BR Backend...")

    # Cria tabelas no banco de dados
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Banco de dados inicializado")

    # Cria diretórios necessários
    os.makedirs(settings.AUDIO_OUTPUT_DIR, exist_ok=True)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"✅ Diretórios criados: {settings.AUDIO_OUTPUT_DIR}, {settings.UPLOAD_DIR}")

    # Cria usuário admin padrão se não existir
    _create_default_admin()

    # Carrega modelos de IA (em background para não bloquear startup)
    import asyncio
    loop = asyncio.get_event_loop()

    async def load_models():
        tts_engine = get_vibevoice_engine()
        asr_engine = get_asr_engine()
        await asyncio.gather(
            loop.run_in_executor(None, tts_engine.load_model),
            loop.run_in_executor(None, asr_engine.load_model),
        )
        logger.info("✅ Todos os modelos carregados!")

    asyncio.create_task(load_models())

    logger.info(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} iniciado!")
    yield

    logger.info("🛑 Encerrando VibeVoice BR...")


def _create_default_admin():
    """Cria admin padrão se não existir."""
    from app.core.auth import get_password_hash
    from app.models.user import User

    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                name="Administrador",
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
                credits=999999,
                plan="admin",
            )
            db.add(admin_user)
            db.commit()
            logger.info(f"✅ Admin criado: {settings.ADMIN_EMAIL}")
        else:
            logger.info(f"ℹ️ Admin já existe: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="API de síntese de voz, clonagem e transcrição em Português Brasileiro",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────────

allowed_origins = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(tts.router)
app.include_router(asr.router)
app.include_router(admin.router)
app.include_router(payments.router)

# ─── Static Files ──────────────────────────────────────────────────────────────

if os.path.exists(settings.AUDIO_OUTPUT_DIR):
    app.mount("/audio", StaticFiles(directory=settings.AUDIO_OUTPUT_DIR), name="audio")

# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint para Docker/Coolify."""
    tts_engine = get_vibevoice_engine()
    asr_engine = get_asr_engine()
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "engines": {
            "tts": tts_engine.is_loaded,
            "asr": asr_engine.is_loaded,
        },
    }


@app.get("/api/config", tags=["System"])
async def get_public_config():
    """Retorna configurações públicas da aplicação (Modo Corporativo vs SaaS)."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "app_mode": settings.APP_MODE,
        "enable_plans": settings.ENABLE_PLANS,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "config": "/api/config",
    }


# ─── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Recurso não encontrado", "path": request.url.path}
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    logger.error(f"Erro interno: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )
