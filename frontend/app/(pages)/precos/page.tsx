'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 49',
    period: '/mês',
    desc: 'Para projetos pequenos, voiceovers e primeiras criações.',
    cta: 'Começar Grátis',
    ctaVariant: 'btn-secondary',
    popular: false,
    features: [
      '300 créditos/mês',
      'Até 75 min de áudio gerado',
      'Até 2 speakers simultâneos',
      'Vozes PT-BR incluídas',
      'Download WAV/MP3',
      'Histórico de 7 dias',
    ],
  },
  {
    name: 'Basic',
    price: 'R$ 149',
    period: '/mês',
    desc: 'Ideal para podcasts, conteúdo regular e projetos multi-speaker.',
    cta: 'Escolher Basic',
    ctaVariant: 'btn-primary',
    popular: true,
    features: [
      '1.000 créditos/mês',
      'Até 250 min de áudio gerado',
      'Até 4 speakers simultâneos',
      'Controle de emoção e tom',
      'Clonagem de voz (3 vozes)',
      'ASR até 60 min/arquivo',
      'Podcast-ready export',
      'Histórico de 30 dias',
    ],
  },
  {
    name: 'Plus',
    price: 'R$ 499',
    period: '/mês',
    desc: 'Para produção de alto volume, audiobooks e empresas.',
    cta: 'Escolher Plus',
    ctaVariant: 'btn-secondary',
    popular: false,
    features: [
      '4.000 créditos/mês',
      'Até 1.000 min de áudio gerado',
      'Episódios longos e narração',
      'Clonagem ilimitada de vozes',
      'Roles complexos de speaker',
      'API REST com webhook',
      'Processamento prioritário',
      'Suporte dedicado',
      'Histórico ilimitado',
    ],
  },
]

const FAQ = [
  {
    q: 'Como funciona o uso interno corporativo?',
    a: 'Em modo corporativo, todos os colaboradores da empresa possuem acesso livre e ilimitado aos recursos de TTS, ASR e Clonagem de Voz sem cobrança de créditos ou assinaturas.',
  },
  {
    q: 'Posso hospedar no meu próprio servidor?',
    a: 'Sim! O VibeVoice BR é open-source e pode ser instalado no seu VPS via Docker ou Coolify.',
  },
  {
    q: 'A qualidade das vozes em PT-BR é boa?',
    a: 'O VibeVoice gera vozes altamente expressivas e naturais. As vozes em Português Brasileiro foram otimizadas para entonação, prosódia e sotaque regional.',
  },
]

export default function PricingPage() {
  const [config, setConfig] = useState<{ app_mode?: string; enable_plans?: boolean }>({})

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {})
  }, [])

  const isInternal = config.app_mode === 'internal_corporate' || config.enable_plans === false

  return (
    <>
      <NavBar />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            {isInternal ? '🏢 Uso Interno Corporativo' : 'Planos e Preços — VibeVoice BR'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
            {isInternal
              ? 'Esta plataforma está configurada em modo corporativo. Todos os recursos de voz estão totalmente liberados para a equipe da empresa.'
              : 'Compare planos, créditos e funcionalidades para TTS multi-speaker, podcasts, clonagem de voz e áudio longo em português.'}
          </p>
        </div>
      </div>

      {/* Corporate Banner when internal */}
      {isInternal && (
        <section style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
          <div className="container" style={{ maxWidth: '800px' }}>
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.1))',
              border: '1px solid rgba(59,130,246,0.3)',
              padding: '2.5rem',
              textAlign: 'center',
              borderRadius: '20px',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                Plataforma Exclusiva para a Empresa
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                O sistema de cobrança e planos comerciais está <strong>desativado</strong>. Todos os funcionários têm acesso irrestrito para gerar síntese de voz (TTS), transcrever reuniões (ASR) e criar vozes clonadas.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/vibevoice" className="btn btn-primary btn-lg" id="btn-corporate-tts">
                  🎙️ Ir para o Studio TTS
                </Link>
                <Link href="/vibevoice-asr" className="btn btn-secondary btn-lg" id="btn-corporate-asr">
                  📝 Ir para Transcrição ASR
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Cards (Only when SaaS / plans enabled) */}
      {!isInternal && (
        <section className="section" style={{ paddingTop: '3rem' }}>
          <div className="container">
            <div className="pricing-grid">
              {PLANS.map(plan => (
                <div
                  key={plan.name}
                  className={`pricing-card${plan.popular ? ' popular' : ''}`}
                  id={`pricing-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && <div className="popular-badge">Mais Popular</div>}

                  <div className="pricing-plan">{plan.name}</div>
                  <div className="pricing-price">
                    {plan.price}<span>{plan.period}</span>
                  </div>
                  <p className="pricing-desc">{plan.desc}</p>

                  <Link
                    href="/registro"
                    className={`btn ${plan.ctaVariant} btn-full`}
                    style={{ marginBottom: '1.5rem' }}
                    id={`btn-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="pricing-features">
                    {plan.features.map(feat => (
                      <li key={feat} className="pricing-feature">
                        <span className="pricing-feature-check">
                          <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{ maxWidth: '700px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.5rem' }}>Perguntas Frequentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQ.map(item => (
              <details
                key={item.q}
                className="card"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <summary style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.q}
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0, color: 'var(--color-blue-light)' }}>
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </summary>
                <p style={{ marginTop: '0.875rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
