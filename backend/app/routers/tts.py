"""
Router TTS — Text-to-Speech endpoints
"""
import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.vibevoice_engine import get_vibevoice_engine
from app.models.user import User
from app.models.job import AudioJob

router = APIRouter(prefix="/api/tts", tags=["TTS"])


# ─── Schemas ───────────────────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    speaker_id: str = Field(default="ana_pt")
    language: str = Field(default="pt")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class ScriptSegment(BaseModel):
    speaker: str
    text: str


class MultiSpeakerRequest(BaseModel):
    script: List[ScriptSegment] = Field(..., min_items=1, max_items=20)
    language: str = Field(default="pt")


class CloneRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="pt")


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/voices")
async def list_voices(language: Optional[str] = None):
    """Lista todas as vozes disponíveis. Filtrável por idioma."""
    engine = get_vibevoice_engine()
    voices = engine.get_available_voices()
    if language:
        voices = [v for v in voices if v["language"].startswith(language)]
    return {"voices": voices}


@router.post("/generate")
async def generate_tts(
    request: TTSRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Gera áudio TTS a partir de texto.
    Requer autenticação para usuários com conta.
    """
    engine = get_vibevoice_engine()

    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo TTS ainda carregando...")

    # Verifica créditos (apenas no modo SaaS com planos ativados)
    if current_user and settings.ENABLE_PLANS and settings.APP_MODE == "saas":
        estimated_duration = len(request.text) / 15  # ~15 chars/segundo
        credits_needed = (estimated_duration / 60) * settings.CREDIT_PER_MINUTE_TTS
        if current_user.credits < credits_needed:
            raise HTTPException(status_code=402, detail="Créditos insuficientes")

    # Cria job
    job = AudioJob(
        user_id=current_user.id if current_user else None,
        job_type="tts",
        status="processing",
        input_text=request.text,
        speaker_id=request.speaker_id,
        language=request.language,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        output_path = os.path.join(
            settings.AUDIO_OUTPUT_DIR,
            f"tts_{job.id}_{uuid.uuid4().hex[:8]}.wav"
        )
        os.makedirs(settings.AUDIO_OUTPUT_DIR, exist_ok=True)

        result = await engine.generate_speech(
            text=request.text,
            speaker_id=request.speaker_id,
            language=request.language,
            speed=request.speed,
            output_path=output_path,
        )

        # Atualiza job
        job.status = "done"
        job.output_file = result["file_path"]
        job.duration_seconds = result["duration_seconds"]
        job.credits_used = (result["duration_seconds"] / 60) * settings.CREDIT_PER_MINUTE_TTS if settings.ENABLE_PLANS else 0.0
        job.completed_at = datetime.utcnow()
        db.commit()

        # Debita créditos apenas se planos ativados
        if current_user:
            if settings.ENABLE_PLANS and settings.APP_MODE == "saas":
                current_user.credits -= job.credits_used
            current_user.total_tts_minutes += result["duration_seconds"] / 60
            db.commit()

        return {
            "job_id": job.id,
            "status": "done",
            "audio_url": f"/api/tts/download/{job.id}",
            "duration_seconds": result["duration_seconds"],
            "credits_used": round(job.credits_used, 2),
        }

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        db.commit()
        logger.error(f"Erro na geração TTS: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na geração: {str(e)}")


@router.post("/multi-speaker")
async def generate_multi_speaker(
    request: MultiSpeakerRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Gera conversação multi-speaker a partir de um script.
    Até 4 speakers simultâneos.
    """
    engine = get_vibevoice_engine()

    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo TTS ainda carregando...")

    # Cria job
    job = AudioJob(
        user_id=current_user.id if current_user else None,
        job_type="multi_speaker",
        status="processing",
        input_text=str([s.dict() for s in request.script]),
        language=request.language,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        script_dicts = [{"speaker": s.speaker, "text": s.text} for s in request.script]
        result = await engine.generate_multi_speaker(
            script=script_dicts,
            language=request.language,
        )

        job.status = "done"
        job.output_file = result["file_path"]
        job.duration_seconds = result["duration_seconds"]
        job.credits_used = (result["duration_seconds"] / 60) * settings.CREDIT_PER_MINUTE_TTS
        job.completed_at = datetime.utcnow()
        db.commit()

        if current_user:
            current_user.credits -= job.credits_used
            db.commit()

        return {
            "job_id": job.id,
            "status": "done",
            "audio_url": f"/api/tts/download/{job.id}",
            "duration_seconds": result["duration_seconds"],
            "segments": result["segments"],
            "credits_used": round(job.credits_used, 2),
        }

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clone")
async def clone_voice(
    text: str,
    reference_file: UploadFile = File(...),
    language: str = "pt",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Clona uma voz a partir de arquivo de referência de áudio (10-30s recomendado).
    """
    engine = get_vibevoice_engine()

    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo TTS não disponível")

    # Valida arquivo
    if not reference_file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser um áudio")

    # Salva arquivo de referência
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ref_filename = f"ref_{uuid.uuid4().hex}.wav"
    ref_path = os.path.join(settings.UPLOAD_DIR, ref_filename)

    async with aiofiles.open(ref_path, "wb") as f:
        content = await reference_file.read()
        await f.write(content)

    # Cria job
    job = AudioJob(
        user_id=current_user.id if current_user else None,
        job_type="clone",
        status="processing",
        input_text=text,
        input_file=ref_path,
        language=language,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        output_path = os.path.join(
            settings.AUDIO_OUTPUT_DIR,
            f"clone_{job.id}_{uuid.uuid4().hex[:8]}.wav"
        )

        result = await engine.clone_voice(
            reference_audio_path=ref_path,
            text=text,
            output_path=output_path,
        )

        job.status = "done"
        job.output_file = result["file_path"]
        job.duration_seconds = result["duration_seconds"]
        job.credits_used = settings.CREDIT_PER_CLONE
        job.completed_at = datetime.utcnow()
        db.commit()

        if current_user:
            current_user.credits -= settings.CREDIT_PER_CLONE
            current_user.total_clones += 1
            db.commit()

        return {
            "job_id": job.id,
            "status": "done",
            "audio_url": f"/api/tts/download/{job.id}",
            "duration_seconds": result["duration_seconds"],
            "credits_used": settings.CREDIT_PER_CLONE,
        }

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{job_id}")
async def download_audio(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Download do arquivo de áudio gerado."""
    job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    if job.status != "done":
        raise HTTPException(status_code=400, detail=f"Job status: {job.status}")
    if not job.output_file or not os.path.exists(job.output_file):
        raise HTTPException(status_code=404, detail="Arquivo de áudio não encontrado")

    return FileResponse(
        path=job.output_file,
        media_type="audio/wav",
        filename=f"vibevoice_{job_id}.wav",
    )


@router.get("/status/{job_id}")
async def get_job_status(job_id: int, db: Session = Depends(get_db)):
    """Verifica status de um job de geração."""
    job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return {
        "job_id": job.id,
        "status": job.status,
        "job_type": job.job_type,
        "duration_seconds": job.duration_seconds,
        "error": job.error_message,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
    }
