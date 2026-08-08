from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "VibeVoice BR"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h

    # Database
    DATABASE_URL: str = "postgresql://vibevoice:vibevoice@postgres:5432/vibevoice"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # VibeVoice Model
    VIBEVOICE_MODEL_PATH: str = "/models/vibevoice"
    VIBEVOICE_DEVICE: str = "cpu"  # "cpu" or "cuda"
    VIBEVOICE_REPO: str = "vibevoice-community/VibeVoice"

    # Whisper ASR
    WHISPER_MODEL: str = "large-v3"  # tiny, base, small, medium, large, large-v3
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"  # float16 para GPU, int8 para CPU
    WHISPER_LANGUAGE: str = "pt"

    # Audio Storage
    AUDIO_STORAGE: str = "local"  # "local" or "s3"
    AUDIO_OUTPUT_DIR: str = "/data/audio_outputs"
    UPLOAD_DIR: str = "/data/uploads"

    # AWS S3 (opcional)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN: Optional[str] = None
    MERCADOPAGO_PUBLIC_KEY: Optional[str] = None
    MERCADOPAGO_WEBHOOK_URL: Optional[str] = None

    # Email
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: str = "noreply@vibevoice.com.br"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    # Admin
    ADMIN_EMAIL: str = "admin@vibevoice.com.br"
    ADMIN_PASSWORD: str = "admin123"  # MUDE em produção

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 10
    MAX_TEXT_LENGTH: int = 5000
    MAX_AUDIO_DURATION_SEC: int = 3600  # 60 minutos

    # Mode: "saas" (com planos/créditos) ou "internal_corporate" (uso interno da empresa)
    APP_MODE: str = "internal_corporate"
    ENABLE_PLANS: bool = False

    # Credits system
    FREE_CREDITS: int = 50
    CREDIT_PER_MINUTE_TTS: int = 5
    CREDIT_PER_MINUTE_ASR: int = 2
    CREDIT_PER_CLONE: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
