'use client'
import { useState, useEffect } from 'react'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function login(pw?: string) {
    const pass = pw ?? password
    if (!pass) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/update', {
      headers: { 'x-admin-password': pass },
    })
    if (res.ok) {
      sessionStorage.setItem('admin_pw', pass)
      setPassword(pass)
      setAuthed(true)
    } else if (res.status === 429) {
      setError('Too many attempts — locked for 5 minutes')
    } else {
      setError('Wrong password')
    }
    setLoading(false)
  }

  function logout() {
    sessionStorage.removeItem('admin_pw')
    setPassword('')
    setAuthed(false)
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw')
    if (saved) login(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:'#0A0E17', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161C2D', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'40px 48px', width:360, textAlign:'center' }}>
        <div style={{ fontFamily:'sans-serif', fontSize:24, fontWeight:700, color:'#F0F4FF', marginBottom:8 }}>Admin<span style={{color:'#00D4FF'}}>.</span></div>
        <div style={{ fontSize:13, color:'#5A6278', marginBottom:28 }}>Portfolio Dashboard</div>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:8, color:'#F0F4FF', fontSize:14, padding:'10px 14px', outline:'none', marginBottom:12, boxSizing:'border-box' }}
        />
        {error && <div style={{ fontSize:12, color:'#FF5C5C', marginBottom:10 }}>{error}</div>}
        <button
          onClick={() => login()}
          disabled={loading}
          style={{ width:'100%', background:'#00D4FF', color:'#000', fontWeight:600, fontSize:14, padding:'11px', borderRadius:8, border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </div>
    </div>
  )

  return <AdminDashboard password={password} onLogout={logout} />
}
