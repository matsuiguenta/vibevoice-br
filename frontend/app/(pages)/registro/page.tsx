'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export default function UserRegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Erro ao realizar cadastro')
      }

      const data = await res.json()
      localStorage.setItem('user_token', data.access_token)
      localStorage.setItem('user_data', JSON.stringify(data.user))
      router.push('/vibevoice')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--nav-height) + 2rem) 1.5rem 4rem',
        background: 'var(--gradient-hero)',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
              🎁 Ganhe 50 Créditos Grátis no Cadastro
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Criar Conta Gratuita</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Sem cartão de crédito necessário · Acesso imediato ao VibeVoice BR
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Nome Completo</label>
                <input
                  id="reg-name"
                  type="text"
                  className="input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">E-mail</label>
                <input
                  id="reg-email"
                  type="email"
                  className="input"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Senha (mín. 6 caracteres)</label>
                <input
                  id="reg-password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error" style={{ fontSize: '0.875rem' }}>
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                id="btn-user-register"
              >
                {loading ? <><span className="spinner" /> Criando conta...</> : 'Criar Conta e Ganhar Créditos'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Já possui uma conta?{' '}
            <Link href="/login" style={{ color: 'var(--color-blue-light)', fontWeight: 600 }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
