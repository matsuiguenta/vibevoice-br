# ───────────────────────────────────────────────
# VibeVoice BR — Backend Dockerfile
# Suporta CPU e GPU (CUDA 12.x)
# ───────────────────────────────────────────────

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Dependências do sistema para áudio e ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    build-essential \
    git \
    curl \
    wget \
    sox \
    libsox-fmt-all \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Clona o repositório VibeVoice community fork
RUN git clone https://github.com/vibevoice-community/VibeVoice.git /models/vibevoice_src || \
    echo "⚠️ Não foi possível clonar VibeVoice - usando modo demo"

# Cria diretórios de dados
RUN mkdir -p /data/audio_outputs /data/uploads /models/vibevoice

# Copia código da aplicação
COPY . .

# Porta da API
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Inicia servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "asyncio"]
