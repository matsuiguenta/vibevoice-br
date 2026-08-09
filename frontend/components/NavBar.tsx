'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const navLinks = [
  { href: '/vibevoice', label: 'VibeVoice TTS' },
  { href: '/vibevoice-asr', label: 'VibeVoice ASR' },
  {
    label: 'Text to Speech',
    children: [
      { href: '/tts-portugues-brasileiro', label: 'TTS Português Brasileiro' },
      { href: '/vibevoice', label: 'TTS Multi-Speaker' },
      { href: '/clonagem-de-voz', label: 'Clonagem de Voz' },
    ],
  },
  { href: '/precos', label: 'Preços' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [config, setConfig] = useState<{ app_mode?: string; enable_plans?: boolean }>({
    app_mode: 'internal_corporate',
    enable_plans: false,
  })

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpenDropdown(null)
    setMobileOpen(false)
  }, [pathname])

  const linksToRender = navLinks.filter(l => {
    if (l.href === '/precos' && (!config.enable_plans && config.app_mode === 'internal_corporate')) {
      return false
    }
    return true
  })

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#3b82f6" strokeWidth="2"/>
            <path d="M7 11 Q9 7 11 11 Q13 15 15 11" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          Vibe<span>Voice BR</span>
        </Link>

        {/* Desktop Links */}
        <ul className="navbar-links" id="main-nav">
          {linksToRender.map((link) =>
            link.children ? (
              <li key={link.label} style={{ position: 'relative' }}>
                <button
                  className={`nav-link btn-ghost`}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'none', font: 'inherit' }}
                  onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                  aria-expanded={openDropdown === link.label}
                  aria-haspopup="true"
                  id={`nav-dropdown-${link.label}`}
                >
                  {link.label}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ transition: 'transform 0.2s', transform: openDropdown === link.label ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  </svg>
                </button>
                {openDropdown === link.label && (
                  <div role="menu" style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    borderRadius: '12px', padding: '0.5rem', minWidth: '220px',
                    boxShadow: 'var(--shadow-card)', zIndex: 200,
                  }}>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        style={{
                          display: 'block', padding: '0.6rem 0.875rem', borderRadius: '8px',
                          fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '' }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href!}
                  className={`nav-link${pathname === link.href ? ' active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />
          <Link href="/login" className="btn btn-secondary btn-sm">
            Entrar
          </Link>
          <Link href="/registro" className="btn btn-primary btn-sm" id="cta-start-free">
            Começar Grátis
          </Link>
          {/* Mobile hamburger */}
          <button
            className="icon-btn"
            style={{ display: 'none' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menu"
            id="mobile-menu-btn"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Click outside closes dropdown */}
      {openDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </nav>
  )
}
