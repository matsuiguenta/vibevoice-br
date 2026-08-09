'use client'
import { useState, useRef, useEffect } from 'react'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e']

export interface VoiceItem {
  id: string
  name: string
  language: string
  gender: string
  isCustom?: boolean
  audioUrl?: string
}

const PRESET_VOICES: Record<string, VoiceItem[]> = {
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
  isCustom?: boolean
  audioUrl?: string
}

interface TTSStudioProps {
  defaultLanguage?: string
}

export default function TTSStudio({ defaultLanguage = 'pt-BR' }: TTSStudioProps) {
  const [text, setText] = useState(
    `Falante 1: Olá! Bem-vindo à plataforma VibeVoice BR, especializada em síntese de voz em Português Brasileiro.\n\nFalante 2: Que ótimo! Posso usar esta ferramenta para criar podcasts, narrações e conteúdo de áudio de forma profissional?\n\nFalante 3: Com certeza! A função de clonagem de voz permite criar uma voz personalizada a partir de uma gravação curta.`
  )
  const [activeLang, setActiveLang] = useState<string>(defaultLanguage)
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { slotId: 0, voiceId: 'ana_pt', name: 'Ana', language: 'pt-BR', color: COLORS[0] },
    { slotId: 1, voiceId: 'pedro_pt', name: 'Pedro', language: 'pt-BR', color: COLORS[1] },
    { slotId: 2, voiceId: 'lucia_pt', name: 'Lúcia', language: 'pt-BR', color: COLORS[2] },
  ])
  const [customVoices, setCustomVoices] = useState<VoiceItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Voice Preview Player State
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null)
  const previewAudioObjRef = useRef<HTMLAudioElement | null>(null)

  // Upload & Record State
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [voiceNameInput, setVoiceNameInput] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  // Load custom voices from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibevoice_custom_voices')
      if (saved) {
        setCustomVoices(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Erro ao carregar vozes customizadas:', e)
    }
  }, [])

  const saveCustomVoice = (voice: VoiceItem) => {
    const updated = [voice, ...customVoices]
    setCustomVoices(updated)
    try {
      localStorage.setItem('vibevoice_custom_voices', JSON.stringify(updated.map(v => ({ ...v, audioUrl: undefined }))))
    } catch (e) {
      console.error(e)
    }
    addSpeaker(voice)
  }

  const addSpeaker = (voice: VoiceItem) => {
    if (speakers.length >= MAX_SPEAKERS) return
    const existingSlots = speakers.map(s => s.slotId)
    const nextSlot = [0, 1, 2, 3].find(i => !existingSlots.includes(i)) ?? speakers.length
    setSpeakers(prev => [
      ...prev,
      {
        slotId: nextSlot,
        voiceId: voice.id,
        name: voice.name,
        language: voice.language,
        color: COLORS[nextSlot % COLORS.length],
        isCustom: voice.isCustom,
        audioUrl: voice.audioUrl,
      }
    ])
  }

  const removeSpeaker = (slotId: number) => {
    setSpeakers(prev => prev.filter(s => s.slotId !== slotId))
  }

  const deleteCustomVoice = (id: string) => {
    const updated = customVoices.filter(v => v.id !== id)
    setCustomVoices(updated)
    setSpeakers(prev => prev.filter(s => s.voiceId !== id))
    try {
      localStorage.setItem('vibevoice_custom_voices', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  // ─── Voice Preview Player ──────────────────────────────────────────────────
  const playVoicePreview = (e: React.MouseEvent, voice: VoiceItem) => {
    e.stopPropagation()

    if (playingPreviewId === voice.id) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (previewAudioObjRef.current) {
        previewAudioObjRef.current.pause()
      }
      setPlayingPreviewId(null)
      return
    }

    setPlayingPreviewId(voice.id)

    // Stop any existing speech synthesis or audio
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (previewAudioObjRef.current) {
      previewAudioObjRef.current.pause()
    }

    if (voice.audioUrl) {
      const tempAudio = new Audio(voice.audioUrl)
      previewAudioObjRef.current = tempAudio
      tempAudio.onended = () => setPlayingPreviewId(null)
      tempAudio.play().catch(() => setPlayingPreviewId(null))
      return
    }

    // Web Speech API / Synthetic Voice Preview
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const phrases: Record<string, string> = {
        ana_pt: 'Olá! Eu sou a Ana. Seja bem-vindo à síntese de voz VibeVoice BR.',
        pedro_pt: 'Olá! Eu sou o Pedro. É um prazer demonstrar minha voz no VibeVoice.',
        lucia_pt: 'Olá! Eu sou a Lúcia. Síntese de voz expressiva com qualidade profissional.',
        carlos_pt: 'Olá! Eu sou o Carlos. Voz natural e autêntica para seus projetos.',
        maria_pt: 'Olá! Eu sou a Maria. Pronta para narrar seus vídeos e podcasts.',
        joao_pt: 'Olá! Eu sou o João. Excelente para conversações e áudios longos.',
        maya_en: 'Hi there! I am Maya, speaking with VibeVoice AI speech synthesis.',
        carter_en: 'Hello! I am Carter. High quality text to speech voice for podcasts.',
        alice_en: 'Hi! I am Alice. Great for your English digital content.',
        frank_en: 'Hello! I am Frank. Expressive AI voice cloning technology.',
        sofia_es: '¡Hola! Soy Sofía. Síntesis de voz expresiva en español.',
        miguel_es: '¡Hola! Soy Miguel. Excelente calidad de voz para tus proyectos.',
      }

      const textToSpeak = phrases[voice.id] || `Olá! Esta é uma demonstração da voz ${voice.name}.`
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = voice.language === 'pt-BR' ? 'pt-BR' : voice.language === 'en-US' ? 'en-US' : 'es-ES'
      utterance.rate = 1.0
      utterance.pitch = voice.gender === 'female' ? 1.1 : 0.95
      utterance.onend = () => setPlayingPreviewId(null)
      utterance.onerror = () => setPlayingPreviewId(null)

      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setPlayingPreviewId(null), 2500)
    }
  }

  // ─── Upload Handler ────────────────────────────────────────────────────────
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const defaultName = file.name.replace(/\.[^/.]+$/, "") || `Voz Personalizada #${customVoices.length + 1}`
    const userVoiceName = prompt('Nome para esta voz clonada:', defaultName) || defaultName

    const newVoice: VoiceItem = {
      id: `custom_up_${Date.now()}`,
      name: userVoiceName,
      language: activeLang === 'custom' ? 'pt-BR' : activeLang,
      gender: 'custom',
      isCustom: true,
      audioUrl: URL.createObjectURL(file),
    }

    saveCustomVoice(newVoice)
    setActiveLang('custom')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Microphone Recording Handlers ──────────────────────────────────────────
  const openRecordingModal = () => {
    setIsRecordingModalOpen(true)
    setRecordedBlob(null)
    setVoiceNameInput('')
    setRecordingTime(0)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const saveRecordedVoice = () => {
    if (!recordedBlob) return
    const vName = voiceNameInput.trim() || `Voz Gravada #${customVoices.length + 1}`
    const newVoice: VoiceItem = {
      id: `custom_rec_${Date.now()}`,
      name: vName,
      language: activeLang === 'custom' ? 'pt-BR' : activeLang,
      gender: 'custom',
      isCustom: true,
      audioUrl: URL.createObjectURL(recordedBlob),
    }

    saveCustomVoice(newVoice)
    setActiveLang('custom')
    setIsRecordingModalOpen(false)
    setRecordedBlob(null)
    setVoiceNameInput('')
  }

  const closeRecordingModal = () => {
    if (isRecording) stopRecording()
    setIsRecordingModalOpen(false)
    setRecordedBlob(null)
  }

  // ─── Generate Audio ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!text.trim()) return
    setGenerating(true)
    setError(null)
    setAudioUrl(null)
    setProgress(10)

    try {
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

      if (!res.ok) throw new Error('Backend offline')
      const data = await res.json()
      setAudioUrl(data.audio_url)
    } catch (err: any) {
      const { createDemoAudioDataUrl } = await import('@/lib/demoAudio')
      setAudioUrl(createDemoAudioDataUrl())
    } finally {
      setProgress(100)
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
      if (!res.ok) throw new Error('Backend offline')
      const data = await res.json()
      setAudioUrl(data.audio_url)
    } catch (err: any) {
      const { createDemoAudioDataUrl } = await import('@/lib/demoAudio')
      setAudioUrl(createDemoAudioDataUrl())
    } finally {
      setProgress(100)
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
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  const isMultiSpeaker = text.includes('Falante 2:') || text.includes('Speaker 2:')

  const currentVoicesList = activeLang === 'custom'
    ? customVoices
    : PRESET_VOICES[activeLang] || []

  return (
    <div className="container" style={{ maxWidth: '1280px' }}>
      {/* Hidden File Input for Voice Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        style={{ display: 'none' }}
      />

      <div className="studio-card">
        {/* Tip Bar */}
        <div className="studio-tip">
          <span>💡 Dica: Use &quot;Falante 1:&quot;, &quot;Falante 2:&quot; para gerar conversações com múltiplos falantes.</span>
          <span className="studio-powered">Powered by VibeVoice BR</span>
        </div>

        {/* Main Editor Body */}
        <div className="studio-body">
          {/* Left — Text Area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <textarea
              className="studio-textarea"
              placeholder={`Digite seu texto aqui...\n\nPara múltiplos falantes:\nFalante 1: Texto do primeiro locutor\nFalante 2: Texto do segundo locutor`}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="studio-footer" style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
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
                      <span className="speaker-lang">{spk.isCustom ? '⭐ Clonada' : spk.language}</span>
                      <div className="speaker-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title={playingPreviewId === spk.voiceId ? 'Pausar preview' : 'Ouvir preview da voz'}
                          onClick={(e) => playVoicePreview(e, {
                            id: spk.voiceId,
                            name: spk.name,
                            language: spk.language,
                            gender: 'custom',
                            isCustom: spk.isCustom,
                            audioUrl: spk.audioUrl
                          })}
                          style={{
                            color: playingPreviewId === spk.voiceId ? 'var(--color-blue-light)' : 'var(--color-text-muted)',
                          }}
                        >
                          {playingPreviewId === spk.voiceId ? (
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <rect x="3" y="2" width="3.5" height="12" rx="1"/>
                              <rect x="9.5" y="2" width="3.5" height="12" rx="1"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M3 2.5l6 3.5-6 3.5V2.5z"/>
                            </svg>
                          )}
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

              {/* Language & Custom Tabs */}
              <div className="lang-tabs" style={{ flexWrap: 'wrap' }}>
                {Object.keys(PRESET_VOICES).map(lang => (
                  <button
                    key={lang}
                    className={`lang-tab${activeLang === lang ? ' active' : ''}`}
                    onClick={() => setActiveLang(lang)}
                  >
                    {lang === 'pt-BR' ? '🇧🇷 PT-BR' : lang === 'en-US' ? '🇺🇸 EN' : '🇪🇸 ES'}
                  </button>
                ))}
                <button
                  className={`lang-tab${activeLang === 'custom' ? ' active' : ''}`}
                  onClick={() => setActiveLang('custom')}
                  style={{ color: activeLang === 'custom' ? '#3b82f6' : 'inherit' }}
                >
                  ✨ Clonadas ({customVoices.length})
                </button>
              </div>

              {/* Upload/Record Action Buttons */}
              <div className="upload-btn-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  onClick={openRecordingModal}
                  id="btn-voice-record"
                >
                  🎙️ Gravar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  onClick={handleUploadClick}
                  id="btn-voice-upload"
                >
                  📤 Upload
                </button>
              </div>

              {/* Voice list */}
              <div className="voice-list">
                {currentVoicesList.length === 0 && activeLang === 'custom' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    Nenhuma voz clonada ainda.<br />Use os botões acima para <strong>Gravar</strong> ou fazer <strong>Upload</strong>!
                  </div>
                )}

                {currentVoicesList.map((voice, i) => {
                  const isAdded = speakers.some(s => s.voiceId === voice.id)
                  const isPreviewPlaying = playingPreviewId === voice.id
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
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="voice-name">{voice.name}</span>
                        {voice.isCustom && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-blue-light)' }}>⭐ Personalizada</span>
                        )}
                      </div>

                      {/* Play Preview Button */}
                      <button
                        type="button"
                        className="icon-btn"
                        title={isPreviewPlaying ? 'Pausar demonstração' : 'Ouvir demonstração da voz'}
                        onClick={(e) => playVoicePreview(e, voice)}
                        style={{
                          color: isPreviewPlaying ? 'var(--color-blue-light)' : 'var(--color-text-muted)',
                          background: isPreviewPlaying ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                          borderRadius: '50%',
                          width: 26,
                          height: 26,
                        }}
                      >
                        {isPreviewPlaying ? (
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <rect x="3" y="2" width="3.5" height="12" rx="1"/>
                            <rect x="9.5" y="2" width="3.5" height="12" rx="1"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3 2.5l6 3.5-6 3.5V2.5z"/>
                          </svg>
                        )}
                      </button>

                      {voice.isCustom && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Excluir voz clonada"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCustomVoice(voice.id)
                          }}
                          style={{ color: 'var(--color-error)' }}
                        >
                          🗑️
                        </button>
                      )}
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
              Gerando áudio com VibeVoice BR...
            </p>
          </div>
        )}

        {/* Embedded Audio Player when generated */}
        {audioUrl && (
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--color-bg-card)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <audio ref={audioRef} style={{ display: 'none' }} />
            <button
              className="btn btn-primary"
              style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="3" y="2" width="3.5" height="12" rx="1"/>
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 2.5l9 5.5-9 5.5V2.5z"/>
                </svg>
              )}
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <span>Áudio Gerado com VibeVoice</span>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <div className="progress-bar" style={{ height: 6, cursor: 'pointer' }} onClick={e => {
                if (!audioRef.current || !duration) return
                const rect = e.currentTarget.getBoundingClientRect()
                const pos = (e.clientX - rect.left) / rect.width
                audioRef.current.currentTime = pos * duration
              }}>
                <div className="progress-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
            </div>

            <a
              href={audioUrl}
              download="vibevoice_audio.wav"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Baixar
            </a>
          </div>
        )}
      </div>

      {/* ─── Modal de Gravação de Microfone ────────────────────────────────────── */}
      {isRecordingModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: '20px', padding: '2rem', maxWidth: '440px', width: '100%',
            boxShadow: 'var(--shadow-card)', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🎙️ Gravar Voz para Clonagem
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Fale de forma clara no microfone por 5 a 10 segundos para criar sua assinatura vocal personalizada.
            </p>

            {!recordedBlob ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', margin: '1.5rem 0' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'var(--color-bg-input)',
                  border: isRecording ? '2px solid #ef4444' : '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', transition: 'all 0.3s ease'
                }}>
                  {isRecording ? '🔴' : '🎙️'}
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  00:{recordingTime < 10 ? '0' : ''}{recordingTime}s
                </div>

                {!isRecording ? (
                  <button type="button" className="btn btn-primary" onClick={startRecording}>
                    ▶️ Iniciar Gravação
                  </button>
                ) : (
                  <button type="button" className="btn btn-error" onClick={stopRecording} style={{ background: '#ef4444', color: '#fff' }}>
                    ⏹️ Parar e Concluir
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', margin: '1rem 0' }}>
                <div className="alert alert-success" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                  ✅ Áudio gravado com sucesso! Preencha o nome abaixo para salvar.
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Nome da Voz Clonada:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Minha Voz Gravada"
                    value={voiceNameInput}
                    onChange={e => setVoiceNameInput(e.target.value)}
                    style={{
                      width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px',
                      background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text)', fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setRecordedBlob(null)}>
                    🔄 Gravar Novamente
                  </button>
                  <button type="button" className="btn btn-primary btn-full" onClick={saveRecordedVoice}>
                    💾 Salvar e Usar Voz
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeRecordingModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
