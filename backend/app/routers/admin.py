"""
Router Admin — Painel Administrativo
Requer autenticação de administrador para todos os endpoints.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.auth import get_current_admin
from app.core.config import settings
from app.core.vibevoice_engine import get_vibevoice_engine
from app.core.asr_engine import get_asr_engine
from app.models.user import User
from app.models.job import AudioJob, Voice, AppConfig

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Métricas gerais do sistema para o dashboard admin."""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_jobs = db.query(func.count(AudioJob.id)).scalar()
    jobs_today = db.query(func.count(AudioJob.id)).filter(
        AudioJob.created_at >= datetime.utcnow() - timedelta(days=1)
    ).scalar()

    # Jobs por tipo
    tts_jobs = db.query(func.count(AudioJob.id)).filter(AudioJob.job_type == "tts").scalar()
    asr_jobs = db.query(func.count(AudioJob.id)).filter(AudioJob.job_type == "asr").scalar()
    clone_jobs = db.query(func.count(AudioJob.id)).filter(AudioJob.job_type == "clone").scalar()
    multi_jobs = db.query(func.count(AudioJob.id)).filter(AudioJob.job_type == "multi_speaker").scalar()

    # Duração total gerada
    total_duration = db.query(func.sum(AudioJob.duration_seconds)).filter(
        AudioJob.status == "done"
    ).scalar() or 0

    # Últimos jobs
    recent_jobs = (
        db.query(AudioJob)
        .order_by(desc(AudioJob.created_at))
        .limit(10)
        .all()
    )

    # Engine status
    tts_engine = get_vibevoice_engine()
    asr_engine = get_asr_engine()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
        },
        "jobs": {
            "total": total_jobs,
            "today": jobs_today,
            "by_type": {
                "tts": tts_jobs,
                "asr": asr_jobs,
                "clone": clone_jobs,
                "multi_speaker": multi_jobs,
            },
        },
        "audio": {
            "total_minutes_generated": round(total_duration / 60, 1),
        },
        "engines": {
            "tts": {
                "loaded": tts_engine.is_loaded,
                "device": settings.VIBEVOICE_DEVICE,
                "model_path": settings.VIBEVOICE_MODEL_PATH,
            },
            "asr": {
                "loaded": asr_engine.is_loaded,
                "model": settings.WHISPER_MODEL,
                "device": settings.WHISPER_DEVICE,
            },
        },
        "recent_jobs": [
            {
                "id": j.id,
                "type": j.job_type,
                "status": j.status,
                "duration": j.duration_seconds,
                "created_at": j.created_at,
            }
            for j in recent_jobs
        ],
    }


# ─── Usuários ──────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Lista todos os usuários."""
    query = db.query(User)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "plan": u.plan,
                "credits": u.credits,
                "is_active": u.is_active,
                "is_admin": u.is_admin,
                "total_tts_minutes": round(u.total_tts_minutes, 1),
                "total_asr_minutes": round(u.total_asr_minutes, 1),
                "created_at": u.created_at,
                "last_login": u.last_login,
            }
            for u in users
        ],
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    credits: Optional[float] = None,
    plan: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Atualiza dados de um usuário."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if is_active is not None:
        user.is_active = is_active
    if is_admin is not None:
        user.is_admin = is_admin
    if credits is not None:
        user.credits = credits
    if plan is not None:
        user.plan = plan

    db.commit()
    return {"message": "Usuário atualizado"}


@router.post("/users/{user_id}/add-credits")
async def add_credits(
    user_id: int,
    amount: float,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Adiciona créditos a um usuário."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.credits += amount
    db.commit()
    return {"message": f"{amount} créditos adicionados. Total: {user.credits}"}


# ─── Modelos / Engines ─────────────────────────────────────────────────────────

class ModelConfig(BaseModel):
    vibevoice_device: Optional[str] = None
    vibevoice_model_path: Optional[str] = None
    whisper_model: Optional[str] = None
    whisper_device: Optional[str] = None
    whisper_compute_type: Optional[str] = None


@router.get("/models/config")
async def get_model_config(_: User = Depends(get_current_admin)):
    """Retorna configuração atual dos modelos."""
    return {
        "vibevoice": {
            "device": settings.VIBEVOICE_DEVICE,
            "model_path": settings.VIBEVOICE_MODEL_PATH,
            "repo": settings.VIBEVOICE_REPO,
        },
        "whisper": {
            "engine_type": settings.ASR_ENGINE_TYPE,
            "model": settings.WHISPER_MODEL,
            "device": settings.WHISPER_DEVICE,
            "compute_type": settings.WHISPER_COMPUTE_TYPE,
            "language": settings.WHISPER_LANGUAGE,
        },
    }


@router.post("/models/reload-tts")
async def reload_tts_model(
    background_tasks: BackgroundTasks,
    _: User = Depends(get_current_admin),
):
    """Recarrega o modelo TTS (VibeVoice)."""
    engine = get_vibevoice_engine()

    def do_reload():
        engine.is_loaded = False
        engine.load_model()

    background_tasks.add_task(do_reload)
    return {"message": "Reload do modelo TTS iniciado em background"}


@router.post("/models/reload-asr")
async def reload_asr_model(
    background_tasks: BackgroundTasks,
    _: User = Depends(get_current_admin),
):
    """Recarrega o modelo ASR (Whisper)."""
    engine = get_asr_engine()

    def do_reload():
        engine.is_loaded = False
        engine.load_model()

    background_tasks.add_task(do_reload)
    return {"message": "Reload do modelo ASR iniciado em background"}


# ─── Configurações ─────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Configurações gerais da aplicação."""
    configs = db.query(AppConfig).all()
    return {
        "configs": {c.key: {"value": c.value, "description": c.description} for c in configs},
        "system": {
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "debug": settings.DEBUG,
            "app_mode": settings.APP_MODE,
            "enable_plans": settings.ENABLE_PLANS,
            "free_credits": settings.FREE_CREDITS,
            "credit_per_minute_tts": settings.CREDIT_PER_MINUTE_TTS,
            "credit_per_minute_asr": settings.CREDIT_PER_MINUTE_ASR,
            "credit_per_clone": settings.CREDIT_PER_CLONE,
            "max_text_length": settings.MAX_TEXT_LENGTH,
        },
    }


@router.put("/settings/{key}")
async def update_setting(
    key: str,
    value: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Atualiza uma configuração do banco de dados."""
    config = db.query(AppConfig).filter(AppConfig.key == key).first()
    if config:
        config.value = value
        config.updated_by = admin.id
    else:
        config = AppConfig(key=key, value=value, updated_by=admin.id)
        db.add(config)
    db.commit()
    return {"message": f"Configuração '{key}' atualizada"}


# ─── Logs / Jobs ───────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Lista todos os jobs de geração."""
    query = db.query(AudioJob)
    if status:
        query = query.filter(AudioJob.status == status)
    if job_type:
        query = query.filter(AudioJob.job_type == job_type)

    total = query.count()
    jobs = query.order_by(desc(AudioJob.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "jobs": [
            {
                "id": j.id,
                "type": j.job_type,
                "status": j.status,
                "user_id": j.user_id,
                "language": j.language,
                "duration_seconds": j.duration_seconds,
                "credits_used": j.credits_used,
                "error": j.error_message,
                "created_at": j.created_at,
                "completed_at": j.completed_at,
            }
            for j in jobs
        ],
    }


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Remove um job e seus arquivos associados."""
    import os
    job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    # Remove arquivos
    for path in [job.output_file, job.input_file]:
        if path and os.path.exists(path):
            os.remove(path)

    db.delete(job)
    db.commit()
    return {"message": "Job removido"}


# ─── Vozes ─────────────────────────────────────────────────────────────────────

@router.get("/voices")
async def list_voices_admin(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Lista vozes do banco de dados."""
    voices = db.query(Voice).order_by(Voice.language, Voice.name).all()
    engine = get_vibevoice_engine()
    builtin = engine.get_available_voices()

    return {
        "builtin": builtin,
        "custom": [
            {
                "id": v.id,
                "voice_id": v.voice_id,
                "name": v.name,
                "language": v.language,
                "gender": v.gender,
                "is_active": v.is_active,
                "is_custom": v.is_custom,
            }
            for v in voices
        ],
    }
