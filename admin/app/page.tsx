'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoot() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    router.replace(token ? '/dashboard' : '/login')
  }, [router])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecionando...</div>
    </div>
  )
}
