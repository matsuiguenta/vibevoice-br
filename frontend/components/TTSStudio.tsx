'use client'
import { useState, useRef, useEffect } from 'react'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e']

const PRESET_VOICES: Record<string, { id: string; name: string; language: string; gender: string }[]> = {
  'pt-BR': [
    { id: 'ana_pt', name: 'Ana', language: 'pt-BR', gender: 'female' },
    { id: 'pedro_pt', name: 'Pedro', language: 'pt-BR', gender: 'male' },
    { id: 'lucia_pt', name: 'Lúcia', language: 'pt-BR', gender: 'female' },
    { id: 'carlos_pt', name: 'Carlos', language: 'pt-BR', gender: 'male' },
    { id: 'maria_pt', name: 'Maria', language: 'pt-BR', gender: 'female' },
    { id: 'joao_pt', name: 'João', language: 'pt-BR', gender: 'male' },
  ],
  'en-US': [
    { id: 'maya_en', name: 'Maya', language: 'en-US', gender: 'female' },
    { id: 'carter_en', name: 'Carter', language: 'en-US', gender: 'male' },
    { id: 'alice_en', name: 'Alice', language: 'en-US', gender: 'female' },
    { id: 'frank_en', name: 'Frank', language: 'en-US', gender: 'male' },
  ],
  'es': [
    { id: 'sofia_es', name: 'Sofía', language: 'es', gender: 'female' },
    { id: 'miguel_es', name: 'Miguel', language: 'es', gender: 'male' },
  ],
}

const MAX_SPEAKERS = 4

interface Speaker {
  slotId: number
  voiceId: string
  name: string
  language: string
  color: string
}

interface TTSStudioProps {
  defaultLanguage?: string
}

export default function TTSStudio({ defaultLanguage = 'pt-BR' }: TTSStudioProps) {
  const [text, setText] = useState(
    `Falante 1: Olá! Bem-vindo à plataforma VibeVoice BR, especializada em síntese de voz em Português Brasileiro.\n\nFalante 2: Que ótimo! Posso usar esta ferramenta para criar podcasts, narrações e conteúdo de áudio de forma profissional?\n\nFalante 3: Com certeza! A função de clonagem de voz permite criar uma voz personalizada a partir de uma gravação curta.`
  )
  const [activeLang, setActiveLang] = useState(defaultLanguage)
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { slotId: 0, voiceId: 'ana_pt', name: 'Ana', language: 'pt-BR', color: COLORS[0] },
    { slotId: 1, voiceId: 'pedro_pt', name: 'Pedro', language: 'pt-BR', color: COLORS[1] },
    { slotId: 2, voiceId: 'lucia_pt', name: 'Lúcia', language: 'pt-BR', color: COLORS[2] },
  ])
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const addSpeaker = (voice: typeof PRESET_VOICES['pt-BR'][0]) => {
    if (speakers.length >= MAX_SPEAKERS) return
    const existingSlots = speakers.map(s => s.slotId)
    const nextSlot = [0, 1, 2, 3].find(i => !existingSlots.includes(i)) ?? speakers.length
    setSpeakers(prev => [
      ...prev,
      { slotId: nextSlot, voiceId: voice.id, name: voice.name, language: voice.language, color: COLORS[nextSlot % COLORS.length] }
    ])
  }

  const removeSpeaker = (slotId: number) => {
    setSpeakers(prev => prev.filter(s => s.slotId !== slotId))
  }

  const handleGenerate = async () => {
    if (!text.trim()) return
    setGenerating(true)
    setError(null)
    setAudioUrl(null)
    setProgress(10)

    try {
      // Build multi-speaker script from text
      const lines = text.split('\n').filter(l => l.trim())
      const script: { speaker: string; text: string }[] = []

      for (const line of lines) {
        const match = line.match(/^Falante\s+(\d+):\s*(.+)/i) ||
                      line.match(/^Speaker\s+(\d+):\s*(.+)/i)
        if (match) {
          const speakerIdx = parseInt(match[1]) - 1
          const spk = speakers[speakerIdx] || speakers[0]
          script.push({ speaker: spk?.voiceId || 'ana_pt', text: match[2].trim() })
        } else if (line.trim()) {
          script.push({ speaker: speakers[0]?.voiceId || 'ana_pt', text: line.trim() })
        }
      }

      setProgress(30)

      const res = await fetch('/api/tts/multi-speaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, language: activeLang === 'pt-BR' ? 'pt' : activeLang.toLowerCase() }),
      })

      setProgress(80)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Erro ao gerar áudio')
      }

      const data = await res.json()
      setAudioUrl(data.audio_url)
      setProgress(100)
    } catch (err: any) {
      setError(err.message || 'Falha na geração')
    } finally {
      setGenerating(false)
    }
  }

  const handleSingleTTS = async () => {
    if (!text.trim()) return
    setGenerating(true)
    setError(null)
    setAudioUrl(null)
    setProgress(20)

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          speaker_id: speakers[0]?.voiceId || 'ana_pt',
          language: activeLang === 'pt-BR' ? 'pt' : activeLang.toLowerCase(),
          speed: 1.0,
        }),
      })
      setProgress(80)
      if (!res.ok) throw new Error('Erro na geração')
      const data = await res.json()
      setAudioUrl(data.audio_url)
      setProgress(100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Audio player controls
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return
    audioRef.current.src = audioUrl
    audioRef.current.onloadedmetadata = () => setDuration(audioRef.current!.duration)
    audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current!.currentTime)
    audioRef.current.onended = () => setIsPlaying(false)
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else { audioRef.current.play(); setIsPlaying(true) }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const isMultiSpeaker = text.includes('Falante') || text.includes('Speaker')

  return (
    <div className="studio-container">
      <div className="studio-card">
        {/* Tip bar */}
        <div className="studio-tip">
          <span>💡 Dica: Use <strong>"Falante 1:"</strong>, <strong>"Falante 2:"</strong> etc. para gerar conversações com múltiplos speakers.</span>
          <span className="studio-powered">Powered by VibeVoice</span>
        </div>

        <div className="studio-body">
          {/* Left — Text Editor */}
          <div className="studio-editor">
            <div className="studio-editor-header">
              <span className="studio-editor-label">Insira seu texto</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', gap: '4px' }}
                onClick={() => setText(
                  `Falante 1: Bem-vindo ao VibeVoice BR! A melhor plataforma de síntese de voz em português.\n\nFalante 2: Impressionante! As vozes soam muito naturais e expressivas.\n\nFalante 3: E a clonagem de voz é simplesmente incrível — poucos segundos de referência bastam!`
                )}
              >
                ✏️ Formato de script
              </button>
            </div>
            <textarea
              id="tts-text-input"
              className="studio-textarea"
              placeholder={`Digite seu texto aqui...\n\nPara múltiplos speakers:\nFalante 1: Texto do primeiro speaker\nFalante 2: Texto do segundo speaker`}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="studio-footer" style={{ padding: '0', borderTop: 'none' }}>
              <span className="char-count">{text.length.toLocaleString('pt-BR')} / 5.000 caracteres</span>
            </div>
          </div>

          {/* Right — Speaker Panel */}
          <div className="speaker-panel">
            {/* Active speakers */}
            <div className="speaker-panel-header">
              Ativos ({speakers.length}/{MAX_SPEAKERS})
            </div>
            {[0, 1, 2, 3].map(slot => {
              const spk = speakers.find(s => s.slotId === slot)
              return (
                <div key={slot} className={`speaker-slot${spk ? ' active' : ' empty'}`}>
                  {spk ? (
                    <>
                      <div className="speaker-avatar" style={{ background: spk.color, color: '#fff', fontSize: '0.65rem' }}>
                        {spk.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="speaker-name">{slot + 1}. {spk.name}</span>
                      <span className="speaker-lang">{spk.language}</span>
                      <div className="speaker-actions">
                        <button className="icon-btn" title="Preview voz">
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3 2.5l6 3.5-6 3.5V2.5z"/>
                          </svg>
                        </button>
                        <button className="icon-btn" title="Remover" onClick={() => removeSpeaker(slot)}>
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.8rem' }}>{slot + 1}. vazio</span>
                  )}
                </div>
              )
            })}

            {/* Voice Selector */}
            <div className="voice-selector">
              <div className="voice-selector-title">Selecionar voz</div>

              {/* Language Tabs */}
              <div className="lang-tabs">
                {Object.keys(PRESET_VOICES).map(lang => (
                  <button
                    key={lang}
                    className={`lang-tab${activeLang === lang ? ' active' : ''}`}
                    onClick={() => setActiveLang(lang)}
                  >
                    {lang === 'pt-BR' ? '🇧🇷 PT-BR' : lang === 'en-US' ? '🇺🇸 EN' : '🇪🇸 ES'}
                  </button>
                ))}
              </div>

              {/* Upload/Record row */}
              <div className="upload-btn-row">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>
                  🎙️ Gravar
                </button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>
                  📤 Upload
                </button>
              </div>

              {/* Voice list */}
              <div className="voice-list">
                {(PRESET_VOICES[activeLang] || []).map((voice, i) => {
                  const isAdded = speakers.some(s => s.voiceId === voice.id)
                  return (
                    <div
                      key={voice.id}
                      className={`voice-item${isAdded ? ' selected' : ''}`}
                      onClick={() => !isAdded && addSpeaker(voice)}
                      style={{ cursor: isAdded ? 'default' : 'pointer' }}
                    >
                      <div className="voice-avatar" style={{ background: COLORS[i % COLORS.length], color: '#fff' }}>
                        {voice.name.substring(0, 2).toUpperCase()}
                        {isAdded && (
                          <span className="voice-num">
                            {speakers.findIndex(s => s.voiceId === voice.id) + 1}
                          </span>
                        )}
                      </div>
                      <span className="voice-name">{voice.name}</span>
                      <button className="icon-btn" title="Preview">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M3 2.5l6 3.5-6 3.5V2.5z"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Generate buttons */}
        <div className="studio-footer">
          {error && (
            <div className="alert alert-error" style={{ flex: 1, margin: 0, padding: '0.5rem 0.875rem' }}>
              ⚠️ {error}
            </div>
          )}
          {!error && <div style={{ flex: 1 }} />}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-generate-single"
              className="btn btn-secondary"
              onClick={handleSingleTTS}
              disabled={generating || !text.trim()}
            >
              {generating ? <span className="spinner" /> : null}
              Gerar (1 voz)
            </button>
            <button
              id="btn-generate-multi"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating || !text.trim()}
            >
              {generating ? <span className="spinner" /> : (
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M2 8l5 5 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isMultiSpeaker ? 'Gerar Multi-Speaker' : 'Gerar Áudio'}
            </button>
          </div>
        </div>

        {/* Progress bar while generating */}
        {generating && (
          <div style={{ padding: '0 1.5rem 1rem' }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Gerando áudio com VibeVoice...
            </p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && !generating && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div className="audio-player">
              <button className="audio-play-btn" onClick={togglePlay} id="audio-play-btn" aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}>
                {isPlaying ? (
                  <svg width="14" height="14" fill="white" viewBox="0 0 14 14">
                    <rect x="2" y="2" width="4" height="10" rx="1"/>
                    <rect x="8" y="2" width="4" height="10" rx="1"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="white" viewBox="0 0 14 14">
                    <path d="M3 2l9 5-9 5V2z"/>
                  </svg>
                )}
              </button>

              {/* Waveform / progress */}
              <div
                className="waveform-container"
                onClick={e => {
                  if (!audioRef.current || !duration) return
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const ratio = (e.clientX - rect.left) / rect.width
                  audioRef.current.currentTime = ratio * duration
                }}
              >
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-blue) 0%, rgba(59,130,246,0.2) 0%)',
                  backgroundSize: `${duration ? (currentTime / duration) * 100 : 0}% 100%, 100% 100%`,
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '6px',
                  transition: 'background-size 0.1s',
                }} />
              </div>

              <span className="audio-time">{formatTime(currentTime)} / {formatTime(duration)}</span>

              <a
                href={audioUrl}
                download="vibevoice-audio.wav"
                className="btn btn-ghost btn-sm"
                title="Baixar áudio"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>
    </div>
  )
}
