"""
VibeVoice Engine — Integração com o modelo de síntese de fala VibeVoice (Community Fork)
Suporta CPU e GPU automaticamente com base nas configurações.
"""
import os
import sys
import torch
import asyncio
import tempfile
import soundfile as sf
from pathlib import Path
from typing import Optional, List, Dict, Any
from loguru import logger
from app.core.config import settings


class VibeVoiceEngine:
    """
    Motor principal de TTS e Voice Cloning usando o fork VibeVoice.
    Carregado como singleton na inicialização da aplicação.
    """

    def __init__(self):
        self.model = None
        self.processor = None
        self.device = settings.VIBEVOICE_DEVICE
        self.model_path = settings.VIBEVOICE_MODEL_PATH
        self.is_loaded = False
        self._lock = asyncio.Lock()

    def _setup_device(self) -> torch.device:
        """Configura o device de processamento (CPU/GPU)."""
        if self.device == "cuda" and torch.cuda.is_available():
            device = torch.device("cuda")
            logger.info(f"✅ GPU disponível: {torch.cuda.get_device_name(0)}")
            logger.info(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            device = torch.device("cpu")
            if self.device == "cuda":
                logger.warning("⚠️ CUDA solicitado mas não disponível. Usando CPU.")
            logger.info(f"✅ Usando CPU para inferência")
        return device

    def load_model(self):
        """
        Carrega o modelo VibeVoice.
        Tenta primeiro o caminho local, depois baixa do HuggingFace Hub.
        """
        try:
            logger.info("🔄 Carregando modelo VibeVoice...")
            device = self._setup_device()

            # Adiciona o repositório clonado ao path Python
            vibevoice_path = Path(self.model_path).parent / "vibevoice_src"
            if vibevoice_path.exists():
                sys.path.insert(0, str(vibevoice_path))
                logger.info(f"📦 Código fonte VibeVoice: {vibevoice_path}")

            # Tenta importar o módulo VibeVoice
            try:
                from vibevoice.inference import VibeVoiceInference
                self.model = VibeVoiceInference(
                    model_path=self.model_path,
                    device=str(device),
                )
                logger.info("✅ Modelo VibeVoice carregado com sucesso!")
            except ImportError:
                logger.warning("⚠️ Módulo VibeVoice não encontrado. Usando modo de simulação.")
                self.model = self._create_mock_model(device)

            self.device_obj = device
            self.is_loaded = True

        except Exception as e:
            logger.error(f"❌ Erro ao carregar VibeVoice: {e}")
            logger.info("🔄 Iniciando em modo de demonstração...")
            self.model = self._create_mock_model(torch.device("cpu"))
            self.is_loaded = True

    def _create_mock_model(self, device: torch.device):
        """Modelo de demonstração para testes sem o VibeVoice instalado."""
        class MockModel:
            def __init__(self, device):
                self.device = device

            def generate(self, text: str, speaker_id: str = "default",
                        reference_audio: Optional[str] = None, **kwargs) -> torch.Tensor:
                """Gera silêncio como placeholder para demonstração."""
                import numpy as np
                # Gera áudio de demo: tom senoidal com duração baseada no texto
                duration = max(1.0, len(text) / 15)  # ~15 chars/segundo
                sample_rate = 22050
                t = np.linspace(0, duration, int(sample_rate * duration))
                freq = 220  # Lá3
                audio = np.sin(2 * np.pi * freq * t) * 0.3
                # Fade in/out suave
                fade = int(0.05 * sample_rate)
                audio[:fade] *= np.linspace(0, 1, fade)
                audio[-fade:] *= np.linspace(1, 0, fade)
                return torch.tensor(audio.astype(np.float32)), sample_rate

        logger.warning("🎭 Usando modelo mock para demonstração")
        return MockModel(device)

    async def generate_speech(
        self,
        text: str,
        speaker_id: str = "default",
        language: str = "pt",
        reference_audio_path: Optional[str] = None,
        speed: float = 1.0,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Gera fala a partir de texto.

        Args:
            text: Texto para converter em fala
            speaker_id: ID do speaker/voz pré-definida
            language: Código de idioma (pt, en, es, etc.)
            reference_audio_path: Caminho para áudio de referência (voice cloning)
            speed: Velocidade de fala (0.5 - 2.0)
            output_path: Caminho para salvar o arquivo de saída

        Returns:
            Dict com caminho do arquivo gerado, duração e metadados
        """
        async with self._lock:
            if not self.is_loaded:
                raise RuntimeError("Modelo não carregado. Aguarde inicialização.")

            try:
                logger.info(f"🎙️ Gerando TTS: '{text[:50]}...' | Speaker: {speaker_id}")

                # Executa inferência em thread separada (não bloqueia event loop)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    self._generate_sync,
                    text, speaker_id, language, reference_audio_path, speed
                )

                audio_tensor, sample_rate = result

                # Salva arquivo de saída
                if output_path is None:
                    os.makedirs(settings.AUDIO_OUTPUT_DIR, exist_ok=True)
                    output_path = os.path.join(
                        settings.AUDIO_OUTPUT_DIR,
                        f"tts_{hash(text + speaker_id)}.wav"
                    )

                audio_np = audio_tensor.cpu().numpy()
                sf.write(output_path, audio_np, sample_rate)

                duration = len(audio_np) / sample_rate

                logger.info(f"✅ Áudio gerado: {output_path} ({duration:.1f}s)")
                return {
                    "file_path": output_path,
                    "duration_seconds": duration,
                    "sample_rate": sample_rate,
                    "speaker_id": speaker_id,
                }

            except Exception as e:
                logger.error(f"❌ Erro na geração TTS: {e}")
                raise

    def _generate_sync(
        self,
        text: str,
        speaker_id: str,
        language: str,
        reference_audio_path: Optional[str],
        speed: float,
    ):
        """Executa inferência de forma síncrona (chamado em executor)."""
        return self.model.generate(
            text=text,
            speaker_id=speaker_id,
            language=language,
            reference_audio=reference_audio_path,
            speed=speed,
        )

    async def generate_multi_speaker(
        self,
        script: List[Dict[str, str]],
        language: str = "pt",
    ) -> Dict[str, Any]:
        """
        Gera conversação multi-speaker a partir de um script.

        Args:
            script: Lista de dicts com 'speaker' e 'text'
            language: Idioma de geração

        Returns:
            Dict com caminho do arquivo de áudio combinado
        """
        import numpy as np
        from scipy.io import wavfile

        audio_segments = []
        sample_rate = 22050

        for segment in script:
            speaker = segment.get("speaker", "default")
            text = segment.get("text", "")
            if not text.strip():
                continue

            result = await self.generate_speech(
                text=text,
                speaker_id=speaker,
                language=language,
            )

            seg_sr, seg_audio = wavfile.read(result["file_path"])
            if seg_sr != sample_rate:
                import librosa
                seg_audio = librosa.resample(seg_audio.astype(float), orig_sr=seg_sr, target_sr=sample_rate)

            # Silêncio entre falas (0.3s)
            silence = np.zeros(int(0.3 * sample_rate))
            audio_segments.extend([seg_audio, silence])

        if not audio_segments:
            raise ValueError("Script vazio — nenhum segmento gerado")

        combined = np.concatenate(audio_segments)

        output_path = os.path.join(
            settings.AUDIO_OUTPUT_DIR,
            f"multi_speaker_{hash(str(script))}.wav"
        )
        sf.write(output_path, combined.astype(np.float32), sample_rate)

        duration = len(combined) / sample_rate
        return {
            "file_path": output_path,
            "duration_seconds": duration,
            "segments": len(script),
        }

    async def clone_voice(
        self,
        reference_audio_path: str,
        text: str,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Clona uma voz a partir de áudio de referência.

        Args:
            reference_audio_path: Caminho do áudio de referência (10-30s recomendado)
            text: Texto para síntese com a voz clonada
            output_path: Caminho de saída

        Returns:
            Dict com resultado da clonagem
        """
        return await self.generate_speech(
            text=text,
            speaker_id="clone",
            reference_audio_path=reference_audio_path,
            output_path=output_path,
        )

    def get_available_voices(self) -> List[Dict[str, Any]]:
        """Retorna lista de vozes disponíveis em português."""
        return [
            # Vozes em Português Brasileiro
            {"id": "ana_pt", "name": "Ana", "language": "pt-BR", "gender": "female", "style": "natural"},
            {"id": "pedro_pt", "name": "Pedro", "language": "pt-BR", "gender": "male", "style": "natural"},
            {"id": "lucia_pt", "name": "Lúcia", "language": "pt-BR", "gender": "female", "style": "warm"},
            {"id": "carlos_pt", "name": "Carlos", "language": "pt-BR", "gender": "male", "style": "professional"},
            {"id": "maria_pt", "name": "Maria", "language": "pt-BR", "gender": "female", "style": "expressive"},
            {"id": "joao_pt", "name": "João", "language": "pt-BR", "gender": "male", "style": "casual"},
            # Vozes em Português Europeu
            {"id": "sofia_pt_eu", "name": "Sofia", "language": "pt-PT", "gender": "female", "style": "formal"},
            {"id": "rui_pt_eu", "name": "Rui", "language": "pt-PT", "gender": "male", "style": "professional"},
            # Vozes em Inglês
            {"id": "maya_en", "name": "Maya", "language": "en-US", "gender": "female", "style": "conversational"},
            {"id": "carter_en", "name": "Carter", "language": "en-US", "gender": "male", "style": "natural"},
            {"id": "alice_en", "name": "Alice", "language": "en-US", "gender": "female", "style": "warm"},
        ]


# Singleton global
_engine_instance: Optional[VibeVoiceEngine] = None


def get_vibevoice_engine() -> VibeVoiceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = VibeVoiceEngine()
    return _engine_instance
