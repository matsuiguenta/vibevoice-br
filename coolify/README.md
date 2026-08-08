# Deploy VibeVoice BR no Coolify

> Guia completo para deploy da plataforma VibeVoice BR no [Coolify](https://coolify.io/) via Docker Compose.

---

## Pré-requisitos

- Coolify instalado no VPS (Ubuntu 22.04 recomendado)
- Repositório Git com o código do VibeVoice BR
- Domínio configurado (ex: vibevoice.com.br)
- Mínimo 32GB RAM para CPU-only, 64GB com GPU

---

## 1. Instalar o Coolify no VPS

```bash
# Conexão SSH ao servidor
ssh root@seu-ip

# Instala o Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Acesse o painel Coolify em `http://seu-ip:8000`.

---

## 2. Configurar o Source (Repositório Git)

1. No Coolify, vá em **Sources** → **New Source**
2. Escolha **GitHub** / **GitLab** / **Self-hosted Git**
3. Conecte sua conta e selecione o repositório `vibevoice-br`

---

## 3. Criar o Projeto

1. Vá em **Projects** → **New Project**
2. Nome: `VibeVoice BR`
3. Clique em **New Resource** → **Docker Compose**
4. Selecione o source configurado acima
5. **Docker Compose File**: `docker-compose.yml`

---

## 4. Configurar Variáveis de Ambiente

No Coolify, vá na aba **Environment Variables** do projeto e adicione:

```
SECRET_KEY=gere-uma-chave-com-openssl-rand-hex-32
POSTGRES_PASSWORD=senha-forte-banco
REDIS_PASSWORD=senha-forte-redis
DATABASE_URL=postgresql://vibevoice:POSTGRES_PASSWORD@postgres:5432/vibevoice
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379/0
ADMIN_EMAIL=admin@seudominio.com.br
ADMIN_PASSWORD=sua-senha-admin-forte
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br
ALLOWED_ORIGINS=https://seudominio.com.br,https://admin.seudominio.com.br
VIBEVOICE_DEVICE=cpu
WHISPER_MODEL=large-v3
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
MERCADOPAGO_ACCESS_TOKEN=seu-token-mp
MERCADOPAGO_PUBLIC_KEY=sua-public-key-mp
```

> ⚠️ Gere a SECRET_KEY com: `openssl rand -hex 32`

---

## 5. Configurar Domínios

No Coolify, configure os domínios para cada serviço:

| Serviço | Domínio Sugerido | Porta |
|---------|-----------------|-------|
| `frontend` | `seudominio.com.br` | 3000 |
| `backend` | `api.seudominio.com.br` | 8000 |
| `admin` | `admin.seudominio.com.br` | 3001 |

O Coolify gera os certificados SSL automaticamente via Let's Encrypt.

---

## 6. Deploy com GPU (Opcional)

Para servidores com GPU NVIDIA:

1. Instale o NVIDIA Container Toolkit no VPS:
```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. No Coolify, adicione o arquivo de override GPU:
   - **Docker Compose Override File**: `docker-compose.gpu.yml`

3. Atualize as variáveis:
```
VIBEVOICE_DEVICE=cuda
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

---

## 7. Volumes Persistentes

O Coolify gerencia volumes automaticamente. Verifique que os seguintes volumes estão configurados:

| Volume | Conteúdo |
|--------|---------|
| `postgres_data` | Dados do banco de dados |
| `audio_data` | Arquivos de áudio gerados |
| `upload_data` | Uploads dos usuários |
| `model_data` | Modelos de IA (VibeVoice + Whisper) |
| `redis_data` | Cache Redis |

---

## 8. Primeiro Acesso

Após o deploy:

1. Acesse `https://seudominio.com.br` — Site principal
2. Acesse `https://admin.seudominio.com.br/login` — Painel Admin
3. Login com: email e senha definidos em `ADMIN_EMAIL` / `ADMIN_PASSWORD`
4. **⚠️ MUDE A SENHA IMEDIATAMENTE no primeiro acesso!**

---

## 9. Monitoramento

No painel Admin (`/dashboard`):
- Verifique o status dos engines (TTS e ASR)
- Se aparecer "Não carregado", clique em **Recarregar**
- O download dos modelos Whisper e VibeVoice acontece na primeira inicialização
- Para modelos grandes (large-v3), aguarde 5–15 minutos

---

## 10. Backup Automático

Configure backup automático do PostgreSQL no Coolify:
- Vá em **Databases** → Seu banco → **Backups**
- Configure frequência e destino (S3, local, etc.)

---

## Troubleshooting Coolify

**Container reiniciando:**
```bash
# No VPS, verifique os logs:
docker logs vibevoice-backend --tail=100
```

**Modelos não baixam:**
- Verifique conectividade com HuggingFace
- O servidor precisa de acesso à internet na porta 443

**SSL não funciona:**
- Certifique-se que as portas 80 e 443 estão abertas no firewall
- Aguarde alguns minutos para o Let's Encrypt validar

**Erro de memória:**
- Reduza o modelo Whisper: `WHISPER_MODEL=medium`
- Use `WHISPER_COMPUTE_TYPE=int8` para menor uso de RAM
