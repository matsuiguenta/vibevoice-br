'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

interface Segment {
  id: number
  start: number
  end: number
  text: string
}

interface TranscriptResult {
  text: string
  language: string
  duration_seconds: number
  segments: Segment[]
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ASRPage() {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('pt')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranscriptResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'full' | 'segments'>('segments')
  const [copied, setCopied] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0])
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'],
      'video/mp4': ['.mp4'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
  })

  const handleTranscribe = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('word_timestamps', 'true')

    try {
      const res = await fetch('/api/asr/transcribe', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro na transcrição')
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadSRT = () => {
    if (!result) return
    const srt = result.segments.map((seg, i) => {
      const toSRT = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        const ms = Math.round((s % 1) * 1000)
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`
      }
      return `${i + 1}\n${toSRT(seg.start)} --> ${toSRT(seg.end)}\n${seg.text}\n`
    }).join('\n')

    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcricao.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <NavBar />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <span className="page-eyebrow">VIBEVOICE ASR</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Transcrição de Áudio para Português
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Até 60 minutos · Identificação de speakers · Timestamps · Suporte a 50+ idiomas com foco em PT-BR
          </p>
        </div>
      </div>

      {/* Main */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`asr-upload-zone${isDragActive ? ' dragging' : ''}`}
            id="asr-drop-zone"
          >
            <input {...getInputProps()} id="asr-file-input" />
            <div className="asr-upload-icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                <path d="M14 4v14M8 10l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>

            {file ? (
              <>
                <div className="asr-upload-title" style={{ color: 'var(--color-blue-light)' }}>
                  📎 {file.name}
                </div>
                <p className="asr-upload-sub">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Clique para trocar o arquivo
                </p>
              </>
            ) : (
              <>
                <div className="asr-upload-title">Carregar Áudio</div>
                <p className="asr-upload-sub">
                  Adicione uma reunião, podcast, entrevista ou aula para transcrever<br />
                  <strong>MP3, WAV, OGG, FLAC, M4A, MP4</strong> · Máx. 500 MB
                </p>
                <button className="btn btn-secondary" type="button" id="asr-choose-audio-btn">
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path d="M8 3v7M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor"/>
                  </svg>
                  Escolher áudio
                </button>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ou arraste e solte aqui</p>
              </>
            )}
          </div>

          {/* Language + Options */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="asr-language">Idioma do Áudio</label>
                <select
                  id="asr-language"
                  className="input"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option value="pt">🇧🇷 Português (Brasil) — Recomendado</option>
                  <option value="en">🇺🇸 Inglês</option>
                  <option value="es">🇪🇸 Espanhol</option>
                  <option value="fr">🇫🇷 Francês</option>
                  <option value="de">🇩🇪 Alemão</option>
                  <option value="it">🇮🇹 Italiano</option>
                  <option value="ja">🇯🇵 Japonês</option>
                  <option value="zh">🇨🇳 Chinês</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Modelo Whisper</label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  large-v3 (maior precisão)
                </div>
              </div>
            </div>
          </div>

          {/* Transcribe Button */}
          <button
            id="btn-transcribe"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1rem' }}
            onClick={handleTranscribe}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Transcrevendo com Whisper...
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                  <path d="M9 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 16h6M9 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Transcrever Áudio
              </>
            )}
          </button>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: '2rem' }}>
              {/* Meta info */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="badge badge-blue">
                  🌐 Idioma: {result.language?.toUpperCase()}
                </div>
                <div className="badge badge-blue">
                  ⏱️ Duração: {formatTime(result.duration_seconds || 0)}
                </div>
                <div className="badge badge-blue">
                  📝 {result.segments?.length || 0} segmentos
                </div>
              </div>

              {/* Tabs + Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['segments', 'full'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'segments' ? '🗂️ Segmentos' : '📄 Texto Completo'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleCopy} id="btn-copy-transcript">
                    {copied ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleDownloadSRT} id="btn-download-srt">
                    💾 Baixar SRT
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="transcript-box">
                {activeTab === 'segments' && result.segments?.length > 0 ? (
                  result.segments.map(seg => (
                    <div key={seg.id} className="transcript-segment">
                      <span className="transcript-time">
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </span>
                      <span className="transcript-text">{seg.text}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--color-text)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {result.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Example info (when no result) */}
          {!result && !loading && (
            <div className="card" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎧</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Pré-visualização da Transcrição</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Após carregar e transcrever seu áudio, o resultado aparecerá aqui com timestamps e segmentos.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
