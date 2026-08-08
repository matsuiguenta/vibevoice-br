"""
Router ASR — Automatic Speech Recognition (Transcrição de Áudio)
Otimizado para Português Brasileiro usando Whisper
"""
import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.asr_engine import get_asr_engine
from app.models.user import User
from app.models.job import AudioJob

router = APIRouter(prefix="/api/asr", tags=["ASR"])


@router.get("/languages")
async def list_languages():
    """Lista idiomas suportados para transcrição."""
    engine = get_asr_engine()
    return {"languages": engine.get_supported_languages()}


@router.get("/status")
async def asr_status():
    """Verifica se o motor ASR está disponível."""
    engine = get_asr_engine()
    return {
        "available": engine.is_loaded,
        "model": settings.WHISPER_MODEL,
        "device": settings.WHISPER_DEVICE,
    }


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(default="pt"),
    task: str = Form(default="transcribe"),
    word_timestamps: bool = Form(default=True),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Transcreve arquivo de áudio para texto.

    - **file**: Arquivo de áudio (mp3, wav, m4a, ogg, flac, mp4)
    - **language**: Código do idioma (pt, en, es...)
    - **task**: 'transcribe' ou 'translate' (traduz para inglês)
    - **word_timestamps**: Inclui timestamps por palavra
    """
    engine = get_asr_engine()

    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Motor ASR não disponível")

    # Valida formato
    allowed_types = {
        "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg",
        "audio/flac", "audio/mp4", "video/mp4", "audio/x-m4a",
        "audio/webm", "audio/aac",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado: {file.content_type}. Use: mp3, wav, ogg, flac, m4a"
        )

    # Salva arquivo temporário
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "wav"
    upload_filename = f"asr_{uuid.uuid4().hex}.{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, upload_filename)

    async with aiofiles.open(upload_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Cria job
    job = AudioJob(
        user_id=current_user.id if current_user else None,
        job_type="asr",
        status="processing",
        input_file=upload_path,
        language=language,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        result = await engine.transcribe(
            audio_path=upload_path,
            language=language,
            task=task,
            word_timestamps=word_timestamps,
        )

        job.status = "done"
        job.transcript = result["text"]
        job.duration_seconds = result.get("duration", 0)
        job.credits_used = (job.duration_seconds / 60) * settings.CREDIT_PER_MINUTE_ASR
        job.completed_at = datetime.utcnow()
        job.metadata = {
            "language_detected": result.get("language"),
            "language_probability": result.get("language_probability"),
            "segments_count": len(result.get("segments", [])),
        }
        db.commit()

        if current_user:
            current_user.credits -= job.credits_used
            current_user.total_asr_minutes += job.duration_seconds / 60
            db.commit()

        return {
            "job_id": job.id,
            "status": "done",
            "text": result["text"],
            "language": result.get("language"),
            "language_probability": result.get("language_probability"),
            "duration_seconds": result.get("duration"),
            "segments": result.get("segments", []),
            "credits_used": round(job.credits_used, 2),
        }

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        db.commit()
        logger.error(f"Erro ASR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Limpa arquivo temporário
        if os.path.exists(upload_path):
            os.remove(upload_path)


@router.get("/history")
async def get_transcription_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Histórico de transcrições do usuário."""
    jobs = (
        db.query(AudioJob)
        .filter(AudioJob.user_id == current_user.id, AudioJob.job_type == "asr")
        .order_by(AudioJob.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "jobs": [
            {
                "id": j.id,
                "status": j.status,
                "language": j.language,
                "duration_seconds": j.duration_seconds,
                "text_preview": (j.transcript or "")[:200],
                "created_at": j.created_at,
            }
            for j in jobs
        ]
    }
