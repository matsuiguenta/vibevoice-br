'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'

interface User {
  id: number; name: string; email: string; plan: string
  credits: number; is_active: boolean; is_admin: boolean
  total_tts_minutes: number; created_at: string; last_login: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' })

  const load = async (q = search) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/users?search=${q}&limit=50`, { headers: headers() })
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const updateUser = async (userId: number, updates: any) => {
    try {
      const params = new URLSearchParams(updates)
      await fetch(`${API}/api/admin/users/${userId}?${params}`, { method: 'PUT', headers: headers() })
      setMsg({ type: 'success', text: 'Usuário atualizado!' })
      load()
      setEditing(null)
    } catch (e) { setMsg({ type: 'error', text: 'Erro ao atualizar' }) }
  }

  const addCredits = async (userId: number, amount: number) => {
    await fetch(`${API}/api/admin/users/${userId}/add-credits?amount=${amount}`, { method: 'POST', headers: headers() })
    setMsg({ type: 'success', text: `${amount} créditos adicionados!` })
    load()
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <span className="admin-page-title">👥 Usuários ({total})</span>
        </div>
        <div className="admin-content">
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>{msg.text}</div>}

          {/* Filters */}
          <div className="filter-bar" style={{ marginBottom: '1rem' }}>
            <input
              className="input"
              style={{ maxWidth: 300 }}
              placeholder="🔍 Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              id="user-search"
            />
            <button className="btn btn-primary btn-sm" onClick={() => load()} id="btn-search-users">Buscar</button>
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Nome</th><th>Email</th><th>Plano</th>
                  <th>Créditos</th><th>TTS (min)</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>#{u.id}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge-status ${u.is_admin ? 'badge-admin' : 'badge-processing'}`}>
                        {u.is_admin ? '👑 Admin' : u.plan}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{Math.round(u.credits)}</td>
                    <td>{u.total_tts_minutes.toFixed(1)} min</td>
                    <td>
                      <span className={`badge-status ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditing(u)}
                          id={`btn-edit-user-${u.id}`}
                        >✏️</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Adicionar 100 créditos"
                          onClick={() => addCredits(u.id, 100)}
                          id={`btn-credits-user-${u.id}`}
                        >+100</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          id={`btn-toggle-user-${u.id}`}
                        >
                          {u.is_active ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editing && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="card" style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Editar #{editing.id} — {editing.name}</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Plano</label>
                      <select className="input" defaultValue={editing.plan}
                        id="edit-user-plan"
                        onChange={e => setEditing({ ...editing, plan: e.target.value })}>
                        {['free', 'starter', 'basic', 'plus', 'admin'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Créditos</label>
                      <input className="input" type="number" defaultValue={editing.credits}
                        id="edit-user-credits"
                        onChange={e => setEditing({ ...editing, credits: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Admin?</label>
                      <select className="input" defaultValue={editing.is_admin ? 'true' : 'false'}
                        id="edit-user-admin"
                        onChange={e => setEditing({ ...editing, is_admin: e.target.value === 'true' })}>
                        <option value="false">Não</option>
                        <option value="true">Sim (Admin)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="input" defaultValue={editing.is_active ? 'true' : 'false'}
                        id="edit-user-status"
                        onChange={e => setEditing({ ...editing, is_active: e.target.value === 'true' })}>
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                    <button
                      id="btn-save-user"
                      className="btn btn-primary"
                      onClick={() => updateUser(editing.id, {
                        plan: editing.plan,
                        credits: editing.credits,
                        is_admin: editing.is_admin,
                        is_active: editing.is_active,
                      })}>
                      💾 Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
