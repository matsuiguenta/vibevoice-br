'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Credenciais inválidas')
      }

      const data = await res.json()

      if (!data.user?.is_admin) {
        throw new Error('Acesso restrito a administradores')
      }

      localStorage.setItem('admin_token', data.access_token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="#3b82f6" strokeWidth="2"/>
              <path d="M7 11 Q9 7 11 11 Q13 15 15 11" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>VibeVoice BR</span>
          </div>
          <div style={{
            display: 'inline-flex',
            padding: '0.25rem 0.875rem',
            borderRadius: '100px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--blue-light)',
          }}>
            Painel Administrativo
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Entrar</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            Acesso restrito a administradores
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">E-mail</label>
              <input
                id="admin-email"
                type="email"
                className="input"
                placeholder="admin@vibevoice.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Senha</label>
              <input
                id="admin-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem' }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              id="btn-admin-login"
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? (
                <><span className="spinner" /> Entrando...</>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          E-mail padrão: <code style={{ color: 'var(--blue-light)' }}>admin@vibevoice.com.br</code>
          <br />
          Defina a senha em <code style={{ color: 'var(--blue-light)' }}>ADMIN_PASSWORD</code> no .env
        </p>
      </div>
    </div>
  )
}
