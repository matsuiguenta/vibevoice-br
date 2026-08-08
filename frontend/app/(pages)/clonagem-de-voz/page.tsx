'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export default function VoiceCloningPage() {
  const [refFile, setRefFile] = useState<File | null>(null)
  const [text, setText] = useState('Olá! Esta é minha voz clonada pelo VibeVoice BR. A qualidade é impressionante e soa muito natural em português brasileiro.')
  const [language, setLanguage] = useState('pt')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) { setRefFile(files[0]); setAudioUrl(null); setError(null) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a'] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  const handleClone = async () => {
    if (!refFile || !text.trim()) return
    setLoading(true)
    setError(null)
    setAudioUrl(null)

    const formData = new FormData()
    formData.append('reference_file', refFile)
    formData.append('text', text)
    formData.append('language', language)

    try {
      const res = await fetch('/api/tts/clone', { method: 'POST', body: formData })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Erro na clonagem')
      }
      const data = await res.json()
      setAudioUrl(data.audio_url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />

      <div className="page-header">
        <div className="container">
          <span className="page-eyebrow">GERADOR DE VOZ PERSONALIZADA</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Clonagem de Voz — Crie sua Voz com IA
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
            Crie uma voz de IA personalizada a partir de uma gravação curta e transforme qualquer texto em fala natural com o VibeVoice. Use para podcasts, narração, vídeos, diálogos e projetos de voz.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="clone-grid">

            {/* Left Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Reference Audio */}
              <div className="clone-panel">
                <div className="clone-panel-title">Áudio de Referência</div>
                <div className="clone-panel-sub">Faça upload de uma gravação clara e autorizada da voz a clonar.</div>

                <div
                  {...getRootProps()}
                  className={`drop-zone${isDragActive ? ' active' : ''}`}
                  id="clone-drop-zone"
                >
                  <input {...getInputProps()} id="clone-ref-input" />
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(59,130,246,0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-blue-light)', margin: '0 auto 1rem',
                  }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 22 22">
                      <path d="M11 3v12M5 9l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {refFile ? (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-blue-light)', marginBottom: '0.25rem' }}>
                        📎 {refFile.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {(refFile.size / 1024 / 1024).toFixed(1)} MB · Clique para trocar
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '0.375rem' }}>Soltar áudio de referência aqui</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ou clique para fazer upload de uma amostra de voz autorizada</div>
                    </div>
                  )}
                </div>

                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5.75.75 0 010-1.5zm0 3a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 7z"/>
                  </svg>
                  <span style={{ fontSize: '0.8rem' }}>
                    <strong>Recomendado:</strong> 10–30 segundos de gravação clara, sem ruído de fundo. Formato MP3 ou WAV.
                  </span>
                </div>
              </div>

              {/* Text to Speak */}
              <div className="clone-panel">
                <div className="clone-panel-title">Texto para Falar</div>
                <div className="clone-panel-sub">Insira as palavras para sua voz personalizada falar.</div>
                <textarea
                  id="clone-text-input"
                  className="input"
                  style={{ minHeight: 120 }}
                  placeholder="Digite o texto que deseja sintetizar com a voz clonada..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="clone-lang">Idioma</label>
                    <select id="clone-lang" className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                      <option value="pt">🇧🇷 Português Brasileiro</option>
                      <option value="en">🇺🇸 Inglês</option>
                      <option value="es">🇪🇸 Espanhol</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Preview & Generation */}
              <div className="clone-panel" style={{ flex: 1 }}>
                <div className="clone-panel-title">Preview & Geração</div>
                <div className="clone-panel-sub">Revise o áudio de referência antes de criar a fala.</div>

                <div style={{
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180,
                  marginBottom: '1rem',
                  gap: '0.75rem',
                }}>
                  {refFile ? (
                    <>
                      <div style={{ fontSize: '2rem' }}>🎵</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{refFile.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Referência carregada · {(refFile.size / 1024).toFixed(0)} KB
                      </div>
                      <audio
                        src={refFile ? URL.createObjectURL(refFile) : ''}
                        controls
                        style={{ width: '100%', borderRadius: 8, marginTop: '0.5rem', height: 36 }}
                      />
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: 'rgba(59,130,246,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-blue-light)',
                      }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 9h10M7 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nenhum áudio selecionado</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        Faça upload de uma gravação de referência para continuar.
                      </div>
                    </>
                  )}
                </div>

                {/* Status */}
                <div className="clone-status">
                  <strong>Status de geração:</strong>{' '}
                  {!refFile
                    ? 'Aguardando áudio de referência...'
                    : loading
                    ? '⏳ Clonando voz com VibeVoice...'
                    : audioUrl
                    ? '✅ Voz gerada com sucesso!'
                    : 'Pronto para gerar — clique em "Clonar Voz"'}
                </div>
              </div>

              {/* Clone Button */}
              <button
                id="btn-clone-voice"
                className="btn btn-primary btn-full btn-lg"
                onClick={handleClone}
                disabled={!refFile || !text.trim() || loading}
              >
                {loading ? (
                  <><span className="spinner" /> Clonando voz...</>
                ) : (
                  <>🔬 Clonar Voz e Gerar Áudio</>
                )}
              </button>

              {error && <div className="alert alert-error">{error}</div>}

              {/* Result Audio */}
              {audioUrl && !loading && (
                <div className="clone-panel">
                  <div className="clone-panel-title">🎉 Voz Clonada — Resultado</div>
                  <div className="audio-player" style={{ marginTop: '0.75rem' }}>
                    <button className="audio-play-btn" onClick={() => setIsPlaying(!isPlaying)} aria-label="Reproduzir">
                      {isPlaying ? (
                        <svg width="14" height="14" fill="white" viewBox="0 0 14 14"><rect x="2" y="2" width="4" height="10" rx="1"/><rect x="8" y="2" width="4" height="10" rx="1"/></svg>
                      ) : (
                        <svg width="14" height="14" fill="white" viewBox="0 0 14 14"><path d="M3 2l9 5-9 5V2z"/></svg>
                      )}
                    </button>
                    <div style={{ flex: 1, height: 32, background: 'rgba(59,130,246,0.1)', borderRadius: 6 }}>
                      <audio src={audioUrl} controls style={{ width: '100%', height: '100%' }} />
                    </div>
                  </div>
                  <a href={audioUrl} download="voz-clonada.wav" className="btn btn-secondary btn-full" style={{ marginTop: '0.75rem' }}>
                    💾 Baixar Áudio
                  </a>
                </div>
              )}

              {/* Tips */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>💡 Dicas para melhor resultado</div>
                <ul style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.25rem' }}>
                  <li>Use gravações sem ruído de fundo</li>
                  <li>10–30 segundos de referência são suficientes</li>
                  <li>Fale de forma natural, com variação de tom</li>
                  <li>Arquivos WAV ou MP3 de alta qualidade funcionam melhor</li>
                  <li>Mantenha consistência de idioma entre referência e texto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
