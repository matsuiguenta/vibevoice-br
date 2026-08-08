import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import TTSStudio from '@/components/TTSStudio'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'VibeVoice TTS — Text to Speech Multi-Speaker em Português',
  description: 'Gere áudio natural com múltiplos speakers usando VibeVoice. Até 4 locutores, 90 minutos de áudio, ideal para podcasts e narrações em PT-BR.',
}

export default function VibeVoicePage() {
  return (
    <>
      <NavBar />
      <div className="page-header">
        <div className="container">
          <span className="page-eyebrow">VIBEVOICE TTS</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            VibeVoice — Text-to-Speech & Voice Cloning
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
            Gere até 90 minutos de áudio com 4 speakers · Clonagem de voz em PT-BR · Podcasts e audiobooks em minutos
          </p>
        </div>
      </div>
      <section style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <TTSStudio defaultLanguage="pt-BR" />
      </section>
      <Footer />
    </>
  )
}
