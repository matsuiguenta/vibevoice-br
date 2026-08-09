'use client'

import { useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('auto')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem('vibevoice_theme') as ThemeMode) || 'auto'
    setTheme(saved)
    applyTheme(saved)
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem('vibevoice_theme', mode)
  }

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode)
    applyTheme(mode)
  }

  if (!mounted) {
    return <div style={{ width: 110, height: 32 }} />
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border)',
        borderRadius: '100px',
        padding: '3px',
        gap: '2px',
        fontSize: '0.75rem',
      }}
      role="group"
      aria-label="Alternar tema da interface"
    >
      <button
        type="button"
        onClick={() => handleSelect('light')}
        title="Modo Claro"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          background: theme === 'light' ? 'var(--color-blue)' : 'transparent',
          color: theme === 'light' ? '#ffffff' : 'var(--color-text-secondary)',
          transition: 'all 0.15s ease',
        }}
        id="theme-light-btn"
      >
        ☀️ <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Claro</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dark')}
        title="Modo Escuro"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          background: theme === 'dark' ? 'var(--color-blue)' : 'transparent',
          color: theme === 'dark' ? '#ffffff' : 'var(--color-text-secondary)',
          transition: 'all 0.15s ease',
        }}
        id="theme-dark-btn"
      >
        🌙 <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Escuro</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('auto')}
        title="Automático (Sistema)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          background: theme === 'auto' ? 'var(--color-blue)' : 'transparent',
          color: theme === 'auto' ? '#ffffff' : 'var(--color-text-secondary)',
          transition: 'all 0.15s ease',
        }}
        id="theme-auto-btn"
      >
        💻 <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Auto</span>
      </button>
    </div>
  )
}
