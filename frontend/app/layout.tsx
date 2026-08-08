import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeVoice BR — IA de Voz em Português Brasileiro',
  description: 'Plataforma de síntese de voz, clonagem de voz e transcrição (ASR) com IA para Português Brasileiro. TTS natural, multi-speaker e reconhecimento de fala.',
  keywords: 'text to speech português, síntese de voz IA, voice cloning, transcrição áudio, ASR português, TTS Brasil',
  openGraph: {
    title: 'VibeVoice BR — IA de Voz em Português Brasileiro',
    description: 'Síntese de voz expressiva, clonagem de voz e transcrição automática em Português Brasileiro.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
