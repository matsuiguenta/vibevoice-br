# VibeVoice BR — Plataforma de IA de Voz em Português Brasileiro

> Síntese de voz expressiva, clonagem de voz e transcrição automática (ASR + Diarização) em Português Brasileiro.  
> Desenvolvido com ❤ por **Rogério Matsui Guenta**. Powered by [VibeVoice Community Fork](https://github.com/vibevoice-community/VibeVoice), [Microsoft VibeASR.cpp](https://github.com/microsoft/VibeASR.cpp) e Inteligência Artificial.

---

## 🚀 Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **TTS Multi-Speaker** | Até 4 speakers simultâneos, conversações e scripts naturais |
| **TTS PT-BR** | Vozes treinadas especificamente para o Português Brasileiro |
| **Voice Cloning** | Clone qualquer voz com 10–30s de áudio de referência |
| **VibeVoice ASR (VibeASR.cpp)** | Transcrição + Diarização de Locutores ("Quem falou o quê") para reuniões sem limite de participantes |
| **Mapeamento de Locutores** | Atribuição interativa dos nomes reais dos participantes (`Locutor 1` ➔ `Prof. Dr. Ricardo`) |
| **Gerador de ATA Oficial** | Formatação automática de documento de ATA de Reunião para Universidades e Prefeituras |
| **Whisper ASR** | Transcrição alternativa via `faster-whisper` (CTranslate2) |
| **Modo Corporativo / SaaS** | Alterne no Admin entre Uso Interno da Empresa (100% livre) ou Modo Comercial SaaS |
| **API REST** | Endpoints documentados com FastAPI e Swagger UI |
| **Painel Admin** | Gerenciamento completo de usuários, métricas, modelos e configurações |

---

## 🏢 Modos de Operação (Empresarial vs SaaS)

O VibeVoice BR permite escolher o modo de funcionamento diretamente no **Painel Admin (`/admin/settings`)** ou no `.env`:

- **🏢 Modo Corporativo (Uso Interno):** `APP_MODE=internal_corporate` e `ENABLE_PLANS=false`
  - Desativa o sistema de cobrança e planos.
  - A página de preços é ocultada da barra de navegação.
  - Recursos de síntese, transcrição, diarização e clonagem ficam **totalmente liberados** para a equipe da empresa.
- **🌐 Modo Público / SaaS:** `APP_MODE=saas` e `ENABLE_PLANS=true`
  - Ativa controle de créditos e planos (Starter, Basic, Plus).
  - Integração com checkout transparente do Mercado Pago.

---

## 🎙️ Motores de Transcrição ASR

Você pode selecionar o motor ASR desejado no Painel Admin:

1. **🔥 VibeVoice ASR (Microsoft VibeASR.cpp) — Recomendado para Reuniões:**
   - Realiza transcrição e **Diarização de Locutores simultânea** ("Locutor 1", "Locutor 2"...).
   - Executa em C++ com quantização BitNet (1,58 GB) de alta eficiência em CPU.
2. **🎙️ OpenAI Whisper (`faster-whisper`):**
   - Transcrição rápida de palavras e parágrafos com suporte a múltiplos idiomas.

---

## 📁 Estrutura do Projeto

```
vibevoice-br/
├── backend/           FastAPI + VibeVoice TTS + VibeVoice ASR + Whisper + ATA Generator
├── frontend/          Next.js 14 — Site, TTS Studio, ASR, Diarização e Gerador de ATA
├── admin/             Next.js 14 — Painel administrativo independente (porta 3001)
├── nginx/             Proxy reverso com streaming de áudio e rate limit
├── coolify/           Guia de deploy passo a passo no Coolify
├── docker-compose.yml Orquestração CPU (padrão)
├── docker-compose.gpu.yml Override para aceleração via GPU NVIDIA
└── .env.example       Template de configuração
```

---

## 🛠️ Instalação Rápida (Docker)

### 1. Pré-requisitos

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git curl
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### 2. Clone e Configure

```bash
git clone https://github.com/matsuiguenta/vibevoice-br.git
cd vibevoice-br

# Crie o arquivo .env a partir do template
cp .env.example .env

# Edite com suas configurações
nano .env
```

**Configurações recomendadas no `.env`:**
```env
SECRET_KEY=chave-aleatoria-segura-aqui
POSTGRES_PASSWORD=senha-forte-aqui
ADMIN_PASSWORD=senha-admin-aqui

# Modo de Funcionamento (internal_corporate = Uso Interno Livre)
APP_MODE=internal_corporate
ENABLE_PLANS=false

# Motor ASR (vibe_asr = VibeASR.cpp com Diarização de Reuniões)
ASR_ENGINE_TYPE=vibe_asr
```

### 3. Inicie os Serviços (CPU)

```bash
docker compose up -d

# Acompanhe os logs
docker compose logs -f backend
```

### 4. Inicie com GPU (NVIDIA)

```bash
# Instale o NVIDIA Container Toolkit primeiro:
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

---

## 🌐 Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Site Principal** | `http://seu-ip` | Studio TTS, ASR, Diarização e ATA |
| **Painel Admin** | `http://seu-ip/admin/` | Gestão e métricas do sistema |
| **API Docs** | `http://seu-ip/docs` | Swagger UI interativo |
| **API Backend** | `http://seu-ip:8000` | FastAPI |

**Login Admin padrão:**
- Email: `admin@vibevoice.com.br`
- Senha: definida em `ADMIN_PASSWORD` no `.env`

---

## 🖥️ Recomendação de Hardware

### Testes / Desenvolvimento Local
- **Processador:** Intel Xeon E5-2670 v3 (12C/24T) ou equivalente
- **RAM:** 16 GB RAM
- **Storage:** 100 GB SSD
- **Desempenho:** ~5-15s para clipes curtos em CPU (`int8`)

### Produção CPU (Mínimo)
- **CPU:** 8 vCPUs (x86_64) | **RAM:** 32 GB | **NVMe:** 100 GB | **Custo:** ~$40-80/mês

### Produção GPU (Recomendado)
- **CPU:** 8-16 vCPUs | **RAM:** 64 GB | **GPU:** NVIDIA RTX 4090 (24GB) ou A10G | **NVMe:** 200 GB | **Custo:** ~$150-350/mês

---

## 🐳 Deploy no Coolify

Veja o guia detalhado em [`coolify/README.md`](./coolify/README.md)

---

## 📡 API Reference

### TTS — Gerar Áudio
```bash
curl -X POST http://localhost:8000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Olá! Esta é uma demonstração do VibeVoice BR.",
    "speaker_id": "ana_pt",
    "language": "pt"
  }'
```

### TTS Multi-Speaker
```bash
curl -X POST http://localhost:8000/api/tts/multi-speaker \
  -H "Content-Type: application/json" \
  -d '{
    "script": [
      {"speaker": "ana_pt", "text": "Bem-vindos ao podcast VibeVoice!"},
      {"speaker": "pedro_pt", "text": "Hoje vamos falar sobre síntese de voz."}
    ],
    "language": "pt"
  }'
```

### ASR com Diarização de Reunião
```bash
curl -X POST http://localhost:8000/api/asr/transcribe \
  -F "file=@reuniao_equipe.mp3" \
  -F "language=pt"
```

### Gerar Documento de ATA Oficial
```bash
curl -X POST http://localhost:8000/api/asr/generate-ata \
  -H "Content-Type: application/json" \
  -d '{
    "institution_name": "UNIVERSIDADE FEDERAL",
    "department": "CONSELHO SUPERIOR",
    "meeting_title": "REUNIÃO ORDINÁRIA",
    "session_number": "01/2026",
    "date_str": "08 de Agosto de 2026",
    "president_name": "Prof. Dr. Carlos Santos",
    "secretary_name": "Dra. Maria Oliveira",
    "speaker_mapping": {"Locutor 1": "Prof. Dr. Carlos Santos", "Locutor 2": "Dra. Maria Oliveira"},
    "segments": [
      {"start": 0.0, "end": 12.0, "speaker": "Locutor 1", "text": "Declaramos aberta a sessão."},
      {"start": 13.0, "end": 25.0, "speaker": "Locutor 2", "text": "Leitura da ordem do dia."}
    ]
  }'
```

### Voice Cloning
```bash
curl -X POST http://localhost:8000/api/tts/clone \
  -F "reference_file=@voz_referencia.wav" \
  -F "text=Texto a ser falado com minha voz clonada" \
  -F "language=pt"
```

---

## 📄 Licença e Créditos

Este projeto integra os forks comunitários [VibeVoice](https://github.com/vibevoice-community/VibeVoice) e [VibeASR.cpp](https://github.com/microsoft/VibeASR.cpp). Consulte os repositórios originais para licenças dos modelos.

---

Desenvolvido com ❤ por **Rogério Matsui Guenta** e **Inteligência Artificial**
