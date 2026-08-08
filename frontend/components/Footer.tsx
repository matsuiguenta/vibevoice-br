import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}>
                <circle cx="11" cy="11" r="10" stroke="#3b82f6" strokeWidth="2"/>
                <path d="M7 11 Q9 7 11 11 Q13 15 15 11" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
              VibeVoice BR
            </span>
            <p className="footer-desc">
              Plataforma de síntese de voz, clonagem e transcrição com IA para Português Brasileiro. Powered by VibeVoice Community Fork.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Produtos</div>
            <ul className="footer-links">
              <li><Link href="/vibevoice">VibeVoice TTS</Link></li>
              <li><Link href="/vibevoice-asr">VibeVoice ASR</Link></li>
              <li><Link href="/clonagem-de-voz">Clonagem de Voz</Link></li>
              <li><Link href="/tts-portugues-brasileiro">TTS Português BR</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Recursos</div>
            <ul className="footer-links">
              <li><Link href="/precos">Preços</Link></li>
              <li><Link href="/docs/api">Documentação API</Link></li>
              <li><Link href="/docs/instalacao">Guia de Instalação</Link></li>
              <li><a href="https://github.com/vibevoice-community/VibeVoice" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Empresa</div>
            <ul className="footer-links">
              <li><Link href="/sobre">Sobre</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><Link href="/termos">Termos de Uso</Link></li>
              <li><Link href="/contato">Contato</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} VibeVoice BR. Todos os direitos reservados.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Powered by{' '}
            <a
              href="https://github.com/vibevoice-community/VibeVoice"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-blue-light)' }}
            >
              VibeVoice Community
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
