'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formVals, setFormVals] = useState<Record<string, string>>({})

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    'Content-Type': 'application/json',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/admin/settings`, { headers: getHeaders() })
        const data = await res.json()
        setSettings(data)
        const vals: Record<string, string> = {}
        Object.entries(data.system || {}).forEach(([k, v]) => { vals[k] = String(v) })
        setFormVals(vals)
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  const saveSetting = async (key: string, value: string) => {
    setSaving(key)
    setMsg(null)
    try {
      const res = await fetch(`${API}/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ value }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      setMsg({ type: 'success', text: `"${key}" salvo com sucesso!` })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(null)
    }
  }

  const CONFIG_SECTIONS = [
    {
      title: '🏢 Modo de Operação da Aplicação',
      desc: 'Alterne entre o uso interno da empresa (sem planos/cobrança) ou modo comercial SaaS.',
      fields: [
        {
          key: 'APP_MODE',
          label: 'Modo de Aplicação',
          type: 'select',
          options: [
            { val: 'internal_corporate', label: '🏢 Uso Interno Corporativo (Sem planos, créditos liberados)' },
            { val: 'saas', label: '🌐 Modo Público / SaaS (Com controle de planos e créditos)' },
          ],
          desc: 'Se definido como Uso Interno Corporativo, as páginas de preços e cobrança são ocultadas e os recursos ficam liberados para todos os colaboradores.',
        },
        {
          key: 'ENABLE_PLANS',
          label: 'Ativar Sistema de Planos e Créditos',
          type: 'select',
          options: [
            { val: 'false', label: '❌ Desativado (Acesso Livre Ilimitado)' },
            { val: 'true', label: '✅ Ativado (Requer Créditos/Assinatura)' },
          ],
          desc: 'Desative para uso 100% livre na empresa.',
        },
      ],
    },
    {
      title: '🤖 Motor VibeVoice (TTS)',
      desc: 'Configurações do modelo de síntese de fala.',
      fields: [
        { key: 'VIBEVOICE_DEVICE', label: 'Device', type: 'select', options: [{ val: 'cpu', label: 'CPU (sem GPU)' }, { val: 'cuda', label: 'GPU (CUDA)' }], desc: 'cpu para servidores sem GPU, cuda para servidores com NVIDIA' },
        { key: 'VIBEVOICE_MODEL_PATH', label: 'Caminho do Modelo', type: 'text', desc: 'Caminho absoluto para os pesos do modelo VibeVoice' },
        { key: 'VIBEVOICE_REPO', label: 'Repositório HuggingFace', type: 'text', desc: 'Ex: vibevoice-community/VibeVoice' },
      ],
    },
    {
      title: '🎤 Motor de Transcrição ASR & Diarização',
      desc: 'Escolha o motor de transcrição e identificação de locutores.',
      fields: [
        {
          key: 'ASR_ENGINE_TYPE',
          label: 'Motor ASR Principal',
          type: 'select',
          options: [
            { val: 'vibe_asr', label: '🔥 VibeVoice ASR (VibeASR.cpp + Diarização de Locutores — Recomendado para Reuniões)' },
            { val: 'whisper', label: '🎙️ OpenAI Whisper (faster-whisper)' },
          ],
          desc: 'VibeVoice ASR identifica simultaneamente Quem (Locutor), Quando (Timestamps) e O que foi dito.',
        },
        { key: 'WHISPER_MODEL', label: 'Modelo Whisper', type: 'select', options: [
          { val: 'tiny', label: 'tiny (~75MB, mais rápido)' },
          { val: 'base', label: 'base (~145MB)' },
          { val: 'small', label: 'small (~460MB)' },
          { val: 'medium', label: 'medium (~1.5GB)' },
          { val: 'large', label: 'large (~2.9GB)' },
          { val: 'large-v3', label: 'large-v3 (~3.1GB, mais preciso)' },
        ], desc: 'Modelos maiores = maior precisão mas mais lento e mais memória RAM/VRAM' },
        { key: 'WHISPER_DEVICE', label: 'Device ASR', type: 'select', options: [{ val: 'cpu', label: 'CPU' }, { val: 'cuda', label: 'GPU (CUDA)' }], desc: 'Device para rodar o Whisper' },
        { key: 'WHISPER_COMPUTE_TYPE', label: 'Tipo de Compute', type: 'select', options: [{ val: 'int8', label: 'int8 (CPU, menor memória)' }, { val: 'float16', label: 'float16 (GPU recomendado)' }, { val: 'float32', label: 'float32 (máxima precisão)' }], desc: 'int8 para CPU, float16 para GPU' },
        { key: 'WHISPER_LANGUAGE', label: 'Idioma Padrão', type: 'text', desc: 'Código ISO do idioma padrão (pt, en, es, etc.)' },
      ],
    },
    {
      title: '💳 Sistema de Créditos',
      desc: 'Ajuste os custos de créditos por operação.',
      fields: [
        { key: 'FREE_CREDITS', label: 'Créditos Gratuitos', type: 'number', desc: 'Créditos concedidos no cadastro de novos usuários' },
        { key: 'CREDIT_PER_MINUTE_TTS', label: 'Créditos por min TTS', type: 'number', desc: 'Custo em créditos por minuto de TTS gerado' },
        { key: 'CREDIT_PER_MINUTE_ASR', label: 'Créditos por min ASR', type: 'number', desc: 'Custo em créditos por minuto de áudio transcrito' },
        { key: 'CREDIT_PER_CLONE', label: 'Créditos por clonagem', type: 'number', desc: 'Custo por operação de clonagem de voz' },
        { key: 'MAX_TEXT_LENGTH', label: 'Tamanho máx. de texto', type: 'number', desc: 'Limite de caracteres por solicitação TTS' },
      ],
    },
    {
      title: '🏦 Mercado Pago',
      desc: 'Integração com o gateway de pagamento Mercado Pago.',
      fields: [
        { key: 'MERCADOPAGO_ACCESS_TOKEN', label: 'Access Token', type: 'password', desc: 'Token de acesso da API do Mercado Pago' },
        { key: 'MERCADOPAGO_PUBLIC_KEY', label: 'Public Key', type: 'text', desc: 'Chave pública para o checkout no front-end' },
        { key: 'MERCADOPAGO_WEBHOOK_URL', label: 'Webhook URL', type: 'text', desc: 'URL para receber notificações de pagamento' },
      ],
    },
    {
      title: '📧 Configurações de E-mail',
      desc: 'SMTP para envio de e-mails transacionais.',
      fields: [
        { key: 'MAIL_SERVER', label: 'Servidor SMTP', type: 'text', desc: 'Ex: smtp.gmail.com' },
        { key: 'MAIL_PORT', label: 'Porta SMTP', type: 'number', desc: '587 para TLS, 465 para SSL' },
        { key: 'MAIL_USERNAME', label: 'Usuário SMTP', type: 'text', desc: 'Email de autenticação' },
        { key: 'MAIL_PASSWORD', label: 'Senha SMTP', type: 'password', desc: 'Senha ou App Password' },
        { key: 'MAIL_FROM', label: 'E-mail remetente', type: 'text', desc: 'Ex: noreply@vibevoice.com.br' },
      ],
    },
    {
      title: '🔒 Segurança',
      desc: 'Configurações de autenticação e segurança.',
      fields: [
        { key: 'ADMIN_EMAIL', label: 'E-mail do Admin', type: 'text', desc: 'E-mail do usuário administrador padrão' },
        { key: 'ADMIN_PASSWORD', label: 'Nova Senha Admin', type: 'password', desc: '⚠️ Altere a senha padrão imediatamente!' },
        { key: 'ACCESS_TOKEN_EXPIRE_MINUTES', label: 'Expiração do Token (min)', type: 'number', desc: 'Tempo de validade do token JWT em minutos (padrão: 1440 = 24h)' },
        { key: 'RATE_LIMIT_PER_MINUTE', label: 'Rate Limit (req/min)', type: 'number', desc: 'Máximo de requisições por minuto por usuário' },
      ],
    },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <span className="admin-page-title">⚙️ Configurações</span>
        </div>

        <div className="admin-content" style={{ maxWidth: 900 }}>
          {msg && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1.5rem' }}>
              {msg.type === 'success' ? '✅' : '❌'} {msg.text}
            </div>
          )}

          {!settings && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Carregando configurações...
            </div>
          )}

          {settings && CONFIG_SECTIONS.map(section => (
            <div key={section.title} className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="font-bold" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{section.title}</div>
                <div className="text-muted text-sm">{section.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {section.fields.map(field => (
                  <div key={field.key}>
                    <div className="form-group">
                      <label className="form-label" htmlFor={`cfg-${field.key}`}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          id={`cfg-${field.key}`}
                          className="input"
                          value={formVals[field.key] || ''}
                          onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                        >
                          {(field as any).options?.map((o: any) => (
                            <option key={o.val} value={o.val}>{o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`cfg-${field.key}`}
                          className="input"
                          type={field.type}
                          value={formVals[field.key] || ''}
                          onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                          placeholder={field.key}
                        />
                      )}
                      {field.desc && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{field.desc}</div>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => saveSetting(field.key, formVals[field.key] || '')}
                      disabled={saving === field.key}
                      id={`btn-save-${field.key}`}
                    >
                      {saving === field.key ? <span className="spinner" /> : '💾'} Salvar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
