# VibeVoice BR — Plataforma de IA de Voz em Português Brasileiro

> Síntese de voz expressiva, clonagem de voz e transcrição automática (ASR) em Português Brasileiro. Powered by [VibeVoice Community Fork](https://github.com/vibevoice-community/VibeVoice).

---

## 🚀 Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **TTS Multi-Speaker** | Até 4 speakers simultâneos, scripts naturais |
| **TTS PT-BR** | Vozes treinadas para Português Brasileiro |
| **Voice Cloning** | Clone qualquer voz com 10–30s de referência |
| **ASR para Português** | Transcrição com Whisper, 60+ min, PT-BR otimizado |
| **API REST** | Endpoints documentados com FastAPI |
| **Painel Admin** | Gerenciamento completo via interface web |

---

## 📁 Estrutura do Projeto

```
vibevoice-br/
├── backend/           FastAPI + VibeVoice engine + Whisper ASR
├── frontend/          Next.js 14 — Site e app de usuário
├── admin/             Next.js 14 — Painel administrativo
├── nginx/             Proxy reverso
├── docker-compose.yml Orquestração CPU (padrão)
├── docker-compose.gpu.yml Override para GPU
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
git clone https://github.com/SEU_USUARIO/vibevoice-br.git
cd vibevoice-br

# Crie o arquivo .env a partir do template
cp .env.example .env

# Edite com suas configurações
nano .env
```

**Configurações mínimas obrigatórias no `.env`:**
```env
SECRET_KEY=chave-aleatoria-segura-aqui
POSTGRES_PASSWORD=senha-forte-aqui
ADMIN_PASSWORD=senha-admin-aqui
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
| **Site** | `http://seu-ip` | Plataforma de usuário |
| **Admin** | `http://seu-ip/admin/` | Painel administrativo |
| **API Docs** | `http://seu-ip/docs` | Swagger UI |
| **API Backend** | `http://seu-ip:8000` | FastAPI direto |

**Login Admin padrão:**
- Email: `admin@vibevoice.com.br`
- Senha: definida em `ADMIN_PASSWORD` no `.env`

---

## 🖥️ Recomendação de Hardware

### CPU-only (Mínimo)
| Item | Spec |
|------|------|
| CPU | 8 vCPUs (x86_64) |
| RAM | 32 GB |
| Storage | 100 GB NVMe |
| OS | Ubuntu 22.04 LTS |
| **Custo estimado** | ~$40-80/mês |

**Tempo de geração:** ~30–60s por minuto de áudio

### Com GPU (Recomendado)
| Item | Spec |
|------|------|
| CPU | 8-16 vCPUs |
| RAM | 64 GB |
| GPU | NVIDIA RTX 4090 (24GB) ou A10G |
| Storage | 200 GB NVMe |
| OS | Ubuntu 22.04 + CUDA 12.x |
| **Custo estimado** | $150-400/mês |

**Tempo de geração:** ~3–8s por minuto de áudio

### Produção (Alta Disponibilidade)
| Item | Spec |
|------|------|
| CPU | 16+ vCPUs |
| RAM | 128 GB |
| GPU | 2x RTX 4090 ou A100 |
| Storage | 500 GB NVMe + S3 |
| **Custo estimado** | $400+/mês |

---

## 🐳 Deploy no Coolify

Veja o guia completo em [`coolify/README.md`](./coolify/README.md)

**Resumo:**
1. Conecte seu repositório Git ao Coolify
2. Configure como **Docker Compose** deployment
3. Adicione as variáveis de ambiente
4. Aponte o domínio para os serviços
5. Deploy!

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

### ASR — Transcrever Áudio

```bash
curl -X POST http://localhost:8000/api/asr/transcribe \
  -F "file=@meu_audio.mp3" \
  -F "language=pt"
```

### Voice Cloning

```bash
curl -X POST http://localhost:8000/api/tts/clone \
  -F "reference_file=@voz_referencia.wav" \
  -F "text=Texto a ser falado com minha voz clonada" \
  -F "language=pt"
```

---

## 🔧 Vozes Disponíveis (PT-BR)

| ID | Nome | Gênero | Estilo |
|----|------|--------|--------|
| `ana_pt` | Ana | Feminino | Natural |
| `pedro_pt` | Pedro | Masculino | Natural |
| `lucia_pt` | Lúcia | Feminino | Calorosa |
| `carlos_pt` | Carlos | Masculino | Profissional |
| `maria_pt` | Maria | Feminino | Expressiva |
| `joao_pt` | João | Masculino | Casual |

---

## 🔑 Comandos Úteis

```bash
# Ver logs de todos os serviços
docker compose logs -f

# Reiniciar apenas o backend
docker compose restart backend

# Ver status dos serviços
docker compose ps

# Executar migrations do banco
docker compose exec backend alembic upgrade head

# Acessar o banco de dados
docker compose exec postgres psql -U vibevoice vibevoice

# Backup do banco
docker compose exec postgres pg_dump -U vibevoice vibevoice > backup.sql

# Atualizar para nova versão
git pull
docker compose build --no-cache
docker compose up -d
```

---

## 📂 Gerenciamento de Modelos

O modelo VibeVoice é baixado automaticamente durante o build. Para usar um modelo local:

```bash
# Monte o diretório de modelos
docker compose exec backend ls /models/

# O VibeVoice é clonado em:
/models/vibevoice_src/

# Os pesos do modelo ficam em:
/models/vibevoice/
```

---

## 🐛 Troubleshooting

**Backend não inicia:**
```bash
docker compose logs backend
# Verifique se DATABASE_URL está correto
```

**Modelo não carrega (modo demo):**
```bash
# O sistema roda em modo demo sem os pesos do VibeVoice
# Para instalar o modelo completo:
docker compose exec backend python -c "from huggingface_hub import snapshot_download; snapshot_download('vibevoice-community/VibeVoice', local_dir='/models/vibevoice')"
```

**CUDA out of memory:**
```bash
# Reduza o modelo Whisper no .env:
WHISPER_MODEL=medium
# Ou use CPU:
WHISPER_DEVICE=cpu
```

**Erro de permissão no /data:**
```bash
sudo chown -R 1001:1001 ./data
```

---

## 📄 Licença

Este projeto usa o fork comunitário do VibeVoice. Consulte a licença do [repositório original](https://github.com/vibevoice-community/VibeVoice) para termos de uso dos modelos.
