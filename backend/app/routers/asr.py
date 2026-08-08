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


# ─── Gerador de ATA Oficial de Reunião ───────────────────────────────────────

class SegmentInput(BaseModel):
    start: float
    end: float
    speaker: str
    text: str


class ATARequest(BaseModel):
    institution_name: str = "UNIVERSIDADE / PREFEITURA MUNICIPAL"
    department: str = "DEPARTAMENTO ADMINISTRATIVO / CONSELHO"
    meeting_title: str = "REUNIÃO ORDINÁRIA"
    session_number: str = "01/2026"
    date_str: str = "08 de Agosto de 2026"
    start_time: str = "14:00"
    end_time: str = "16:00"
    location: str = "Sala de Reuniões Principal / Videoconferência"
    president_name: str = "Presidente da Sessão"
    secretary_name: str = "Secretário(a) Geral"
    pauta: str = "1. Abertura dos trabalhos e alinhamento de pauta.\n2. Discussão de projetos e deliberações."
    speaker_mapping: dict = {}  # {"Locutor 1": "Prof. Dr. João Silva"}
    segments: List[SegmentInput] = []


@router.post("/generate-ata")
async def generate_ata_document(req: ATARequest):
    """
    Gera um documento de ATA OFICIAL de Reunião nos padrões de redação pública/universitária.
    """
    # Mapeia nomes dos locutores
    mapped_speakers = set()
    formatted_body = []

    for seg in req.segments:
        spk_raw = seg.speaker.strip()
        spk_name = req.speaker_mapping.get(spk_raw, spk_raw)
        mapped_speakers.add(spk_name)

        min_s = int(seg.start // 60)
        sec_s = int(seg.start % 60)
        time_tag = f"[{min_s:02d}:{sec_s:02d}]"

        formatted_body.append(f"{time_tag} {spk_name}: {seg.text}")

    attendees_str = ", ".join(sorted(list(mapped_speakers))) if mapped_speakers else "Membros presentes"

    # Template Padrão Oficial de ATA
    ata_content = f"""================================================================================
{req.institution_name.upper()}
{req.department.upper()}
================================================================================

ATA DA {req.session_number.upper()} {req.meeting_title.upper()}

Às {req.start_time} horas do dia {req.date_str}, reuniu-se na {req.location}, o colegiado sob a presidência do(a) Sr.(a) {req.president_name} e secretariado por {req.secretary_name}, contando com a presença dos seguintes participantes: {attendees_str}.

I. ORDEM DO DIA / PAUTA:
{req.pauta}

II. REGISTRO CONTÍNUO E TRANSCRIÇÃO DAS DELIBERAÇÕES:
{" ".join([seg.text for seg in req.segments])}

III. REGISTRO DETALHADO POR LOCUTOR E MARCAÇÃO TEMPORAL:
{chr(10).join(formatted_body)}

IV. ENCERRAMENTO:
Nada mais havendo a tratar, o(a) Senhor(a) Presidente encerrou os trabalhos às {req.end_time} horas, da qual eu, {req.secretary_name}, lavrei a presente Ata que, lida e achada conforme, vai assinada por mim e pelo(a) Senhor(a) Presidente.

________________________________________
{req.president_name}
Presidente da Sessão

________________________________________
{req.secretary_name}
Secretário(a) Geral
================================================================================
"""

    return {
        "status": "success",
        "title": f"ATA_{req.session_number.replace('/', '_')}",
        "ata_text": ata_content,
        "participants": list(mapped_speakers),
    }

