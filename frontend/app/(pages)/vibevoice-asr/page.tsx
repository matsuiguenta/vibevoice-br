'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

interface Segment {
  id: number
  start: number
  end: number
  speaker?: string
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

  // Speaker mapping state
  const [speakerMapping, setSpeakerMapping] = useState<Record<string, string>>({})
  
  // ATA Modal state
  const [showAtaModal, setShowAtaModal] = useState(false)
  const [generatingAta, setGeneratingAta] = useState(false)
  const [ataResult, setAtaResult] = useState<string | null>(null)
  const [institution, setInstitution] = useState('UNIVERSIDADE / PREFEITURA MUNICIPAL')
  const [department, setDepartment] = useState('DEPARTAMENTO ADMINISTRATIVO / CONSELHO')
  const [sessionNum, setSessionNum] = useState('01/2026')
  const [meetingDate, setMeetingDate] = useState(new Date().toLocaleDateString('pt-BR'))
  const [president, setPresident] = useState('Prof.(a) Presidente da Sessão')
  const [secretary, setSecretary] = useState('Secretário(a) Geral')
  const [pauta, setPauta] = useState('1. Abertura dos trabalhos.\n2. Discussão e deliberação da pauta do dia.')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0])
      setResult(null)
      setError(null)
      setSpeakerMapping({})
      setAtaResult(null)
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
    setAtaResult(null)

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

      // Initialize speaker mapping
      const detected = new Set<string>()
      data.segments?.forEach((s: any) => {
        if (s.speaker) detected.add(s.speaker)
      })
      const initialMap: Record<string, string> = {}
      detected.forEach(spk => { initialMap[spk] = spk })
      setSpeakerMapping(initialMap)

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
      const spk = seg.speaker ? speakerMapping[seg.speaker] || seg.speaker : ''
      return `${i + 1}\n${toSRT(seg.start)} --> ${toSRT(seg.end)}\n${spk ? `[${spk}] ` : ''}${seg.text}\n`
    }).join('\n')

    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcricao.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerateAta = async () => {
    if (!result) return
    setGeneratingAta(true)

    try {
      const payload = {
        institution_name: institution,
        department: department,
        meeting_title: 'REUNIÃO ORDINÁRIA',
        session_number: sessionNum,
        date_str: meetingDate,
        start_time: '14:00',
        end_time: '16:00',
        location: 'Sala de Reuniões / Videoconferência',
        president_name: president,
        secretary_name: secretary,
        pauta: pauta,
        speaker_mapping: speakerMapping,
        segments: result.segments.map(s => ({
          start: s.start,
          end: s.end,
          speaker: s.speaker || 'Locutor',
          text: s.text,
        })),
      }

      const res = await fetch('/api/asr/generate-ata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setAtaResult(data.ata_text)
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingAta(false)
    }
  }

  const uniqueSpeakers = Array.from(new Set(result?.segments?.map(s => s.speaker).filter(Boolean) || []))

  return (
    <>
      <NavBar />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <span className="page-eyebrow">VIBEVOICE ASR & DIARIZAÇÃO</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Transcrição de Reuniões & Gerador de ATA Oficial
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
            Identificação de múltiplos locutores (sem limite de participantes) · Mapeamento de nomes · Gerador de ATA oficial para Universidades e Prefeituras
          </p>
        </div>
      </div>

      {/* Main */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>

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
                <div className="asr-upload-title">Carregar Áudio da Reunião</div>
                <p className="asr-upload-sub">
                  Adicione uma reunião, assembleia, conselho ou aula para transcrever<br />
                  <strong>MP3, WAV, OGG, FLAC, M4A, MP4</strong> · Máx. 500 MB
                </p>
                <button className="btn btn-secondary" type="button" id="asr-choose-audio-btn">
                  Escolher áudio da reunião
                </button>
              </>
            )}
          </div>

          {/* Options */}
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
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motor ASR & Diarização</label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-blue-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                  🔥 VibeVoice ASR (VibeASR.cpp + Diarização)
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
                Transcrevendo e identificando locutores da reunião...
              </>
            ) : (
              <>🎙️ Transcrever & Identificar Locutores</>
            )}
          </button>

          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>⚠️ {error}</div>}

          {/* Result */}
          {result && (
            <div style={{ marginTop: '2rem' }}>

              {/* Meta info */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="badge badge-blue">🌐 Idioma: {result.language?.toUpperCase()}</div>
                <div className="badge badge-blue">⏱️ Duração: {formatTime(result.duration_seconds || 0)}</div>
                <div className="badge badge-blue">👥 {uniqueSpeakers.length} locutores detectados</div>
              </div>

              {/* Interactive Speaker Mapping Card */}
              {uniqueSpeakers.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-card-hover)', borderColor: 'rgba(59,130,246,0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👥 Nomear Locutores da Reunião</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      (Substitua os rótulos automáticos pelos nomes reais dos participantes)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {uniqueSpeakers.map(spk => (
                      <div key={spk} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-blue-light)' }}>
                          {spk}:
                        </label>
                        <input
                          className="input"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          placeholder={`Nome do ${spk}`}
                          value={speakerMapping[spk] || ''}
                          onChange={e => setSpeakerMapping({ ...speakerMapping, [spk]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs + Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['segments', 'full'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'segments' ? '🗂️ Segmentos por Locutor' : '📄 Texto Completo'}
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
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAtaModal(true)} id="btn-open-ata-modal">
                    📜 Gerar ATA Oficial
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="transcript-box">
                {activeTab === 'segments' && result.segments?.length > 0 ? (
                  result.segments.map((seg: any) => {
                    const mappedName = seg.speaker ? (speakerMapping[seg.speaker] || seg.speaker) : null
                    return (
                      <div key={seg.id} className="transcript-segment">
                        <div>
                          <span className="transcript-time">
                            {formatTime(seg.start)} → {formatTime(seg.end)}
                          </span>
                          {mappedName && (
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--color-blue-light)',
                              background: 'rgba(59,130,246,0.12)',
                              border: '1px solid rgba(59,130,246,0.25)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '100px',
                              display: 'inline-block',
                              marginTop: '0.25rem',
                            }}>
                              👤 {mappedName}
                            </div>
                          )}
                        </div>
                        <span className="transcript-text">{seg.text}</span>
                      </div>
                    )
                  })
                ) : (
                  <p style={{ color: 'var(--color-text)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {result.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ATA Generator Modal */}
          {showAtaModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              backdropFilter: 'blur(8px)',
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📜 Gerador de ATA Oficial de Reunião</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAtaModal(false)}>✕</button>
                </div>

                {!ataResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Instituição / Órgão</label>
                        <input className="input" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex: UNIVERSIDADE FEDERAL" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Departamento / Conselho</label>
                        <input className="input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Ex: DEPARTAMENTO ADMINISTRATIVO" />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Número da ATA / Sessão</label>
                        <input className="input" value={sessionNum} onChange={e => setSessionNum(e.target.value)} placeholder="Ex: ATA N° 04/2026" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Data da Reunião</label>
                        <input className="input" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Presidente da Sessão</label>
                        <input className="input" value={president} onChange={e => setPresident(e.target.value)} placeholder="Nome do Presidente" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Secretário(a) Geral</label>
                        <input className="input" value={secretary} onChange={e => setSecretary(e.target.value)} placeholder="Nome do Secretário" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pauta / Ordem do Dia</label>
                      <textarea className="input" style={{ minHeight: 70 }} value={pauta} onChange={e => setPauta(e.target.value)} />
                    </div>

                    <button
                      className="btn btn-primary btn-full btn-lg"
                      onClick={handleGenerateAta}
                      disabled={generatingAta}
                      id="btn-generate-ata-submit"
                    >
                      {generatingAta ? <span className="spinner" /> : '⚡ Gerar Documento de ATA'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="badge badge-blue">✅ ATA Gerada no Padrão Oficial</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { navigator.clipboard.writeText(ataResult); alert('ATA copiada!'); }}
                        >
                          📋 Copiar Texto
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const blob = new Blob([ataResult], { type: 'text/plain;charset=utf-8' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${sessionNum.replace(/[/\\?%*:|"<>]/g, '_')}_ATA.txt`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          💾 Baixar ATA (.TXT / DOC)
                        </button>
                      </div>
                    </div>

                    <pre style={{
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '1.5rem',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}>
                      {ataResult}
                    </pre>

                    <button
                      className="btn btn-secondary btn-full"
                      style={{ marginTop: '1rem' }}
                      onClick={() => setAtaResult(null)}
                    >
                      ✏️ Editar Parâmetros da ATA
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}
