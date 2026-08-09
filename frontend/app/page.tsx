import type { Metadata } from 'next'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import TTSStudio from '@/components/TTSStudio'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'VibeVoice BR — IA Text-to-Speech para Português Brasileiro',
  description: 'Gere até 90 minutos de fala · 4 speakers · clipes curtos em ~30s. Plataforma de síntese de voz, clonagem e ASR em Português Brasileiro.',
}

const FEATURES = [
  {
    icon: '🎙️',
    title: 'TTS Multi-Speaker',
    desc: 'Crie conversações naturais com até 4 speakers distintos. Ideal para podcasts, diálogos e conteúdo longo em português.',
  },
  {
    icon: '🔬',
    title: 'Clonagem de Voz',
    desc: 'Clone qualquer voz com apenas 10–30 segundos de referência. Crie vozes personalizadas para suas produções.',
  },
  {
    icon: '📝',
    title: 'ASR para Português',
    desc: 'Transcreva áudios de até 60 minutos com identificação de speakers, timestamps e suporte completo ao PT-BR.',
  },
  {
    icon: '🇧🇷',
    title: 'Vozes Brasileiras',
    desc: 'Vozes treinadas especificamente para o Português Brasileiro com entonação, sotaque e naturalidade autênticos.',
  },
  {
    icon: '⚡',
    title: 'Geração Rápida',
    desc: 'Gere clipes curtos em ~30 segundos. Suporte a GPU para produção de alta velocidade no seu servidor.',
  },
  {
    icon: '🔌',
    title: 'API REST Completa',
    desc: 'Integre o VibeVoice BR em seus sistemas com nossa API documentada. Suporte a Webhook e processamento assíncrono.',
  },
]

const STATS = [
  { value: '90min', label: 'de áudio por geração' },
  { value: '4', label: 'speakers simultâneos' },
  { value: '50+', label: 'idiomas no ASR' },
  { value: '~30s', label: 'para clipes curtos' },
]

export default function HomePage() {
  return (
    <>
      <NavBar />

      {/* ── Hero ── */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="badge badge-blue" style={{ marginBottom: '1.5rem' }}>
            <span className="badge-dot" />
            Gratuito para testar — Sem cartão de crédito
          </div>

          <h1 className="hero-title">
            VibeVoice BR —{' '}
            <span className="hero-title-accent">IA de Voz para</span>
            <br />Conversações Reais
          </h1>

          <p className="hero-subtitle">
            Gere até <strong>90 min</strong> de fala ·{' '}
            <strong>4 speakers</strong> · clipes curtos em{' '}
            <strong>~30 s</strong>
          </p>
        </div>

        {/* TTS Studio App embedded in hero */}
        <TTSStudio defaultLanguage="pt-BR" />
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '3rem 0', background: 'rgba(15,22,41,0.5)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
            {STATS.map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-blue-light)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" id="recursos">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3.5rem' }}>
            <span className="section-eyebrow">Recursos</span>
            <h2 className="section-title">Tudo que você precisa para<br />produção de voz em PT-BR</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Plataforma completa com TTS expressivo, clonagem de voz e ASR com qualidade profissional em Português Brasileiro.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ fontSize: '1.5rem' }}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <span className="section-eyebrow">Casos de Uso</span>
              <h2 className="section-title">Para que serve o VibeVoice BR?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                {[
                  { emoji: '🎧', title: 'Podcasts e Audiobooks', desc: 'Crie podcasts completos com múltiplos apresentadores ou narração de livros em voz natural.' },
                  { emoji: '🎓', title: 'e-Learning em Português', desc: 'Produza cursos online com narração profissional sem precisar de estúdio de gravação.' },
                  { emoji: '📱', title: 'Acessibilidade Digital', desc: 'Torne seus apps e sites acessíveis com leitura de conteúdo em português natural.' },
                  { emoji: '🤖', title: 'Assistentes Virtuais', desc: 'Dê voz aos seus chatbots e assistentes com uma voz clonada da sua marca.' },
                ].map(uc => (
                  <div key={uc.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{uc.emoji}</div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{uc.title}</div>
                      <p style={{ fontSize: '0.875rem' }}>{uc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '3px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              }} />
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎙️</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Experimente Agora</h3>
                <p style={{ fontSize: '0.875rem' }}>Sem cadastro para primeiros testes</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/vibevoice" className="btn btn-primary btn-full btn-lg" id="cta-try-tts">
                  🎧 Gerar TTS em Português
                </Link>
                <Link href="/vibevoice-asr" className="btn btn-secondary btn-full" id="cta-try-asr">
                  📝 Transcrever Áudio (ASR)
                </Link>
                <Link href="/clonagem-de-voz" className="btn btn-secondary btn-full" id="cta-try-clone">
                  🔬 Clonar Minha Voz
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.1))',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '24px',
            padding: '4rem 2rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '2px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
            }} />
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>
              Pronto para começar?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
              Comece com créditos gratuitos. Sem cartão de crédito necessário.
              Deploy no seu servidor VPS com Docker.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/registro" className="btn btn-primary btn-lg" id="cta-signup">
                Criar Conta Gratuita
              </Link>
              <Link href="/precos" className="btn btn-secondary btn-lg" id="cta-pricing">
                Ver Planos e Preços
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
