'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'

interface DashboardData {
  users: { total: number; active: number }
  jobs: { total: number; today: number; by_type: Record<string, number> }
  audio: { total_minutes_generated: number }
  engines: {
    tts: { loaded: boolean; device: string; model_path: string }
    asr: { loaded: boolean; model: string; device: string }
  }
  recent_jobs: Array<{
    id: number; type: string; status: string; duration: number; created_at: string
  }>
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    done: 'badge-done', processing: 'badge-processing',
    error: 'badge-error', pending: 'badge-pending',
  }
  return map[status] || 'badge-pending'
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState<string | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Acesso negado')
      setData(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const reloadEngine = async (engine: 'tts' | 'asr') => {
    setReloading(engine)
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${API}/api/admin/models/reload-${engine}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setTimeout(fetchDashboard, 2000)
    } finally {
      setReloading(null)
    }
  }

  const STATS = data ? [
    { label: 'Total de Usuários', value: data.users.total, sub: `${data.users.active} ativos`, icon: '👥', color: 'rgba(59,130,246,0.12)' },
    { label: 'Jobs Hoje', value: data.jobs.today, sub: `${data.jobs.total} total`, icon: '⚡', color: 'rgba(6,182,212,0.12)' },
    { label: 'Minutos Gerados', value: `${data.audio.total_minutes_generated}`, sub: 'Total de áudio', icon: '🎙️', color: 'rgba(34,197,94,0.12)' },
    { label: 'Jobs TTS', value: data.jobs.by_type.tts || 0, sub: `${data.jobs.by_type.asr || 0} ASR`, icon: '📊', color: 'rgba(245,158,11,0.12)' },
  ] : []

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <span className="admin-page-title">Dashboard</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboard} id="btn-refresh-dashboard">
            🔄 Atualizar
          </button>
        </div>

        <div className="admin-content">
          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Carregando métricas...
            </div>
          )}

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {data && (
            <>
              {/* Stats */}
              <div className="stats-grid">
                {STATS.map(stat => (
                  <div key={stat.label} className="stat-card">
                    <div>
                      <div className="stat-label">{stat.label}</div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-change text-muted">{stat.sub}</div>
                    </div>
                    <div className="stat-icon" style={{ background: stat.color, fontSize: '1.25rem' }}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Engine Status */}
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* TTS Engine */}
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold">🤖 Motor TTS (VibeVoice)</div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => reloadEngine('tts')}
                      disabled={reloading === 'tts'}
                      id="btn-reload-tts"
                    >
                      {reloading === 'tts' ? <span className="spinner" /> : '↺'} Recarregar
                    </button>
                  </div>
                  <div className="engine-status">
                    <div className={`status-dot ${data.engines.tts.loaded ? 'online' : 'offline'}`} />
                    {data.engines.tts.loaded ? '✅ Carregado' : '❌ Não carregado'}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Device: <strong style={{ color: 'var(--text-secondary)' }}>{data.engines.tts.device}</strong></span>
                    <span>Modelo: <strong style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{data.engines.tts.model_path}</strong></span>
                  </div>
                </div>

                {/* ASR Engine */}
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold">🎤 Motor ASR (Whisper)</div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => reloadEngine('asr')}
                      disabled={reloading === 'asr'}
                      id="btn-reload-asr"
                    >
                      {reloading === 'asr' ? <span className="spinner" /> : '↺'} Recarregar
                    </button>
                  </div>
                  <div className="engine-status">
                    <div className={`status-dot ${data.engines.asr.loaded ? 'online' : 'offline'}`} />
                    {data.engines.asr.loaded ? '✅ Carregado' : '❌ Não carregado'}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Device: <strong style={{ color: 'var(--text-secondary)' }}>{data.engines.asr.device}</strong></span>
                    <span>Modelo: <strong style={{ color: 'var(--text-secondary)' }}>{data.engines.asr.model}</strong></span>
                  </div>
                </div>
              </div>

              {/* Jobs Breakdown */}
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div className="font-bold mb-2">📊 Jobs por Tipo</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { key: 'tts', label: 'TTS (1 speaker)' },
                      { key: 'multi_speaker', label: 'TTS Multi-Speaker' },
                      { key: 'asr', label: 'ASR (Transcrição)' },
                      { key: 'clone', label: 'Clonagem de Voz' },
                    ].map(item => {
                      const count = data.jobs.by_type[item.key] || 0
                      const total = data.jobs.total || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={item.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                            <span style={{ fontWeight: 600 }}>{count}</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', borderRadius: 2 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card">
                  <div className="font-bold mb-2">📈 Resumo de Uso</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Total de Jobs', val: data.jobs.total },
                      { label: 'Jobs Hoje', val: data.jobs.today },
                      { label: 'Minutos de TTS Gerados', val: `${data.audio.total_minutes_generated} min` },
                      { label: 'Usuários Ativos', val: data.users.active },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <strong style={{ color: 'var(--text)' }}>{item.val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <span className="admin-table-title">Últimos Jobs</span>
                  <a href="/logs" className="btn btn-secondary btn-sm" id="btn-view-all-jobs">Ver todos →</a>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Duração</th>
                      <th>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_jobs.map(job => (
                      <tr key={job.id}>
                        <td style={{ color: 'var(--text)', fontWeight: 600 }}>#{job.id}</td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>
                            {job.type === 'multi_speaker' ? 'Multi-Speaker' : job.type.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${getStatusClass(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{job.duration ? `${job.duration.toFixed(1)}s` : '—'}</td>
                        <td>{new Date(job.created_at).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
