"""
Celery App Configuration & Background Tasks
Processamento assíncrono de jobs pesados de TTS, ASR e Clonagem de Voz
"""
import os
import time
from celery import Celery
from loguru import logger

from app.core.config import settings

celery_app = Celery(
    "vibevoice_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hora máx por tarefa
)


@celery_app.task(bind=True, name="process_tts_job")
def process_tts_job(self, job_id: int, text: str, speaker_id: str, language: str, speed: float):
    """Processa geração de TTS em background."""
    logger.info(f"🔄 Processing TTS Job #{job_id}")
    from app.core.database import SessionLocal
    from app.models.job import AudioJob
    from app.core.vibevoice_engine import get_vibevoice_engine

    db = SessionLocal()
    try:
        job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
        if not job:
            logger.error(f"Job #{job_id} não encontrado no banco")
            return

        job.status = "processing"
        db.commit()

        engine = get_vibevoice_engine()
        output_filename = f"tts_{job_id}_{int(time.time())}.wav"
        output_path = os.path.join(settings.AUDIO_OUTPUT_DIR, output_filename)

        res = engine.generate_tts(
            text=text,
            speaker_id=speaker_id,
            language=language,
            speed=speed,
            output_path=output_path,
        )

        job.status = "done"
        job.output_file = output_path
        job.duration_seconds = res.get("duration", 0.0)
        db.commit()
        logger.info(f"✅ Job #{job_id} concluído com sucesso")
        return {"status": "done", "output_file": output_path}
    except Exception as e:
        logger.error(f"❌ Erro no Job #{job_id}: {e}")
        if db:
            job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
            if job:
                job.status = "error"
                job.error_message = str(e)
                db.commit()
        raise e
    finally:
        db.close()


@celery_app.task(bind=True, name="process_asr_job")
def process_asr_job(self, job_id: int, input_file_path: str, language: str):
    """Processa transcrição de áudio ASR em background."""
    logger.info(f"🔄 Processing ASR Job #{job_id}")
    from app.core.database import SessionLocal
    from app.models.job import AudioJob
    from app.core.asr_engine import get_asr_engine

    db = SessionLocal()
    try:
        job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
        if not job:
            return

        job.status = "processing"
        db.commit()

        engine = get_asr_engine()
        result = engine.transcribe(input_file_path, language=language)

        job.status = "done"
        job.transcript_text = result.get("text", "")
        job.duration_seconds = result.get("duration", 0.0)
        db.commit()
        logger.info(f"✅ ASR Job #{job_id} concluído")
        return result
    except Exception as e:
        logger.error(f"❌ Erro no ASR Job #{job_id}: {e}")
        if db:
            job = db.query(AudioJob).filter(AudioJob.id == job_id).first()
            if job:
                job.status = "error"
                job.error_message = str(e)
                db.commit()
        raise e
    finally:
        db.close()
