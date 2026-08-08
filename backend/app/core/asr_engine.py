"""
ASR Engine — Automatic Speech Recognition usando Whisper (OpenAI/faster-whisper)
Otimizado para Português Brasileiro
"""
import os
import asyncio
import tempfile
from typing import Optional, Dict, Any, List
from pathlib import Path
from loguru import logger
from app.core.config import settings


class WhisperASREngine:
    """
    Motor ASR usando Whisper, com foco em Português Brasileiro.
    Usa faster-whisper para maior velocidade (CTranslate2 backend).
    """

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self._lock = asyncio.Lock()

    def load_model(self):
        """Carrega o modelo Whisper otimizado."""
        try:
            logger.info(f"🔄 Carregando Whisper ASR: {settings.WHISPER_MODEL}...")
            from faster_whisper import WhisperModel

            self.model = WhisperModel(
                settings.WHISPER_MODEL,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
            )
            self.is_loaded = True
            logger.info(f"✅ Whisper {settings.WHISPER_MODEL} carregado!")
        except ImportError:
            logger.warning("⚠️ faster-whisper não instalado. Tentando whisper original...")
            try:
                import whisper
                self.model = whisper.load_model(settings.WHISPER_MODEL)
                self.model_type = "original"
                self.is_loaded = True
                logger.info(f"✅ Whisper original carregado: {settings.WHISPER_MODEL}")
            except Exception as e:
                logger.error(f"❌ Erro ao carregar Whisper: {e}")
                self.model = None
                self.is_loaded = False
        except Exception as e:
            logger.error(f"❌ Erro ao carregar Whisper: {e}")
            self.is_loaded = False

    async def transcribe(
        self,
        audio_path: str,
        language: str = "pt",
        task: str = "transcribe",
        speaker_diarization: bool = False,
        word_timestamps: bool = True,
    ) -> Dict[str, Any]:
        """
        Transcreve áudio para texto.

        Args:
            audio_path: Caminho do arquivo de áudio
            language: Código do idioma (pt, en, es...)
            task: "transcribe" ou "translate"
            speaker_diarization: Se deve identificar speakers
            word_timestamps: Inclui timestamps por palavra

        Returns:
            Dict com texto transcrito, segmentos e metadados
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("ASR não disponível. Modelo não carregado.")

        async with self._lock:
            logger.info(f"🎤 Transcrevendo: {audio_path} (idioma: {language})")
            loop = asyncio.get_event_loop()

            result = await loop.run_in_executor(
                None,
                self._transcribe_sync,
                audio_path, language, task, word_timestamps
            )

            logger.info(f"✅ Transcrição concluída: {len(result['text'])} chars")
            return result

    def _transcribe_sync(
        self,
        audio_path: str,
        language: str,
        task: str,
        word_timestamps: bool,
    ) -> Dict[str, Any]:
        """Executa transcrição sincronamente."""
        try:
            # faster-whisper
            from faster_whisper import WhisperModel
            segments, info = self.model.transcribe(
                audio_path,
                language=language,
                task=task,
                word_timestamps=word_timestamps,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
            )

            all_segments = []
            full_text = []

            for seg in segments:
                segment_data = {
                    "id": seg.id,
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip(),
                    "words": [],
                }

                if word_timestamps and seg.words:
                    for word in seg.words:
                        segment_data["words"].append({
                            "word": word.word,
                            "start": round(word.start, 2),
                            "end": round(word.end, 2),
                            "probability": round(word.probability, 3),
                        })

                all_segments.append(segment_data)
                full_text.append(seg.text.strip())

            return {
                "text": " ".join(full_text),
                "language": info.language,
                "language_probability": round(info.language_probability, 3),
                "duration": round(info.duration, 2),
                "segments": all_segments,
            }

        except (ImportError, AttributeError):
            # Fallback para whisper original
            import whisper
            result = self.model.transcribe(
                audio_path,
                language=language,
                task=task,
                word_timestamps=word_timestamps,
                verbose=False,
            )
            return {
                "text": result["text"],
                "language": result.get("language", language),
                "language_probability": 1.0,
                "duration": 0.0,
                "segments": [
                    {
                        "id": i,
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": seg["text"].strip(),
                        "words": seg.get("words", []),
                    }
                    for i, seg in enumerate(result.get("segments", []))
                ],
            }

    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Retorna idiomas suportados com foco em português."""
        return [
            {"code": "pt", "name": "Português (Brasil)", "flag": "🇧🇷"},
            {"code": "en", "name": "Inglês", "flag": "🇺🇸"},
            {"code": "es", "name": "Espanhol", "flag": "🇪🇸"},
            {"code": "fr", "name": "Francês", "flag": "🇫🇷"},
            {"code": "de", "name": "Alemão", "flag": "🇩🇪"},
            {"code": "it", "name": "Italiano", "flag": "🇮🇹"},
            {"code": "ja", "name": "Japonês", "flag": "🇯🇵"},
            {"code": "zh", "name": "Chinês", "flag": "🇨🇳"},
        ]


# Singleton
_asr_instance: Optional[WhisperASREngine] = None


def get_asr_engine() -> WhisperASREngine:
    global _asr_instance
    if _asr_instance is None:
        _asr_instance = WhisperASREngine()
    return _asr_instance
