import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import TTSStudio from '@/components/TTSStudio'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Text to Speech Português Brasileiro — Vozes Naturais com IA',
  description: 'Ferramenta gratuita de Text to Speech para Português Brasileiro. Vozes naturais de IA com entonação autêntica. TTS PT-BR online sem cadastro.',
}

const VOICES = [
  { name: 'Ana', gender: 'Feminino', style: 'Natural', emoji: '👩' },
  { name: 'Pedro', gender: 'Masculino', style: 'Natural', emoji: '👨' },
  { name: 'Lúcia', gender: 'Feminino', style: 'Calorosa', emoji: '👩' },
  { name: 'Carlos', gender: 'Masculino', style: 'Profissional', emoji: '👨' },
  { name: 'Maria', gender: 'Feminino', style: 'Expressiva', emoji: '👩' },
  { name: 'João', gender: 'Masculino', style: 'Casual', emoji: '👨' },
]

export default function TTSPortuguesPage() {
  return (
    <>
      <NavBar />
      <div className="page-header">
        <div className="container">
          <span className="page-eyebrow">TEXT TO SPEECH PT-BR</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Text to Speech Português Brasileiro
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto 2rem' }}>
            Vozes de IA treinadas especialmente para o Português Brasileiro com entonação, prosódia e naturalidade autênticas. Converta qualquer texto em fala de alta qualidade.
          </p>
          {/* Voice showcase */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {VOICES.map(v => (
              <div key={v.name} style={{
                padding: '0.5rem 1rem',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '100px',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
              }}>
                {v.emoji} {v.name} — {v.style}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TTS Studio */}
      <section style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <TTSStudio defaultLanguage="pt-BR" />
      </section>

      {/* Features table */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
            Por que escolher o TTS PT-BR do VibeVoice?
          </h2>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              { icon: '🎯', title: 'Treinado para PT-BR', desc: 'Modelos otimizados para entonação e prosódia do Português Brasileiro, não apenas tradução literal.' },
              { icon: '🎭', title: 'Expressividade Natural', desc: 'As vozes variam naturalmente o ritmo, ênfase e tom conforme o contexto do texto.' },
              { icon: '⚡', title: 'Rápido e Eficiente', desc: 'Gere clipes curtos em ~30s. Textos longos processados de forma assíncrona com notificação.' },
              { icon: '🔌', title: 'API para Integração', desc: 'Endpoint REST para integrar TTS PT-BR em seus apps, chatbots, sistemas de acessibilidade e mais.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ fontSize: '1.5rem' }}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
