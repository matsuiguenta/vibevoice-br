'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Usuários', icon: '👥' },
  { href: '/logs', label: 'Jobs / Logs', icon: '📋' },
  { href: '/voices', label: 'Vozes', icon: '🎙️' },
  { section: 'Configurações' },
  { href: '/models', label: 'Modelos de IA', icon: '🤖' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#3b82f6" strokeWidth="2"/>
          <path d="M7 11 Q9 7 11 11 Q13 15 15 11" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </svg>
        <span className="sidebar-logo-text">VibeVoice BR</span>
        <span className="sidebar-logo-badge">Admin</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {NAV_ITEMS.map((item, i) => {
          if ('section' in item) {
            return <div key={i} className="sidebar-section-title">{item.section}</div>
          }
          const isActive = pathname.startsWith(item.href!)
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`sidebar-link${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/" target="_blank" className="sidebar-link" style={{ fontSize: '0.8rem' }}>
          <span>🌐</span> Ver Site
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
          id="admin-logout-btn"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  )
}
