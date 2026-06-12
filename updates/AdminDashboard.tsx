'use client'
import { useState, useEffect, useRef } from 'react'

const s: Record<string, React.CSSProperties> = {
  shell:    { display:'grid', gridTemplateColumns:'220px 1fr', minHeight:'100vh', background:'#0A0E17', color:'#F0F4FF', fontFamily:'Inter,sans-serif' },
  aside:    { background:'#0F1420', borderRight:'0.5px solid rgba(255,255,255,0.07)', padding:'24px 0', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto' },
  logo:     { fontFamily:'Space Grotesk,sans-serif', fontSize:18, fontWeight:700, padding:'0 20px 24px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', marginBottom:16, color:'#F0F4FF' },
  main:     { padding:'32px 40px', overflowY:'auto' },
  panel:    { background:'#161C2D', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:10, padding:24, marginBottom:16 },
  panelTitle:{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#00D4FF', marginBottom:16 },
  input:    { background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:7, color:'#F0F4FF', fontFamily:'Inter,sans-serif', fontSize:13, padding:'9px 12px', outline:'none', width:'100%', marginBottom:4 },
  label:    { fontSize:11, fontWeight:600, color:'#5A6278', letterSpacing:'.5px', textTransform:'uppercase' as const, marginBottom:5, display:'block' },
  row2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 },
  row1:     { display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:14 },
  btn:      { display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, padding:'8px 16px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif' },
  btnPrimary:{ background:'#00D4FF', color:'#000' },
  btnGhost: { background:'transparent', border:'0.5px solid rgba(255,255,255,0.13)', color:'#8A94A8' },
  btnDanger:{ background:'rgba(255,92,92,0.12)', border:'0.5px solid rgba(255,92,92,0.25)', color:'#FF5C5C' },
  listItem: { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:8, border:'0.5px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', marginBottom:8 },
  toast:    { position:'fixed' as const, top:24, right:32, background:'#00E5A0', color:'#000', fontSize:12, fontWeight:600, padding:'10px 18px', borderRadius:8, zIndex:300, transition:'all .3s' },
}

type Section = 'profile'|'projects'|'skills'|'certifications'|'contact'

export default function AdminDashboard({ password, onLogout }: { password: string; onLogout?: () => void }) {
  const [page, setPage]     = useState<Section>('profile')
  const [data, setData]     = useState<any>(null)
  const [dirty, setDirty]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState('')
  const [modal, setModal]   = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  // local edits for profile fields
  const [prof, setProf]     = useState<Record<string,string>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await fetch('/api/update', { headers: { 'x-admin-password': password } })
    const d   = await res.json()
    setData(d)
    setProf(d.profile || {})
    setDirty(false)
  }

  async function saveAll() {
    setSaving(true)
    const payload = { ...data, profile: { ...data.profile, ...prof } }
    const res = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ data: payload }),
    })
    setSaving(false)
    if (res.ok) { showToast('✓ Saved & deployed!'); setDirty(false); setData(payload) }
    else        { showToast('❌ Save failed') }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Upload image file → GitHub public/images/ → returns URL path
  async function uploadImage(file: File): Promise<string | null> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async ev => {
        const img = new Image()
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const max = 1200
          let w = img.width, h = img.height
          if (w > h) { if (w > max) { h = Math.round(h*max/w); w = max } }
          else       { if (h > max) { w = Math.round(w*max/h); h = max } }
          canvas.width = w; canvas.height = h
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          const base64 = dataUrl.split(',')[1]
          const filename = `${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}.jpg`
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
            body: JSON.stringify({ filename, base64 }),
          })
          if (res.ok) {
            const { url } = await res.json()
            resolve(url)
          } else resolve(null)
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  function toggleSection(key: string) {
    setData((d: any) => ({
      ...d,
      sectionsVisible: { ...(d.sectionsVisible || {}), [key]: !((d.sectionsVisible || {})[key] !== false) },
    }))
    setDirty(true)
  }

  function toggleProject(i: number) {
    setData((d: any) => {
      const arr = [...d.projects]
      arr[i] = { ...arr[i], visible: !(arr[i].visible !== false) }
      return { ...d, projects: arr }
    })
    setDirty(true)
  }

  function field(key: string, label: string, type = 'text') {
    return (
      <div>
        <label style={s.label}>{label}</label>
        <input
          type={type}
          style={s.input}
          value={prof[key] || ''}
          onChange={e => { setProf(p => ({...p, [key]: e.target.value})); setDirty(true) }}
        />
      </div>
    )
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 400
        let w = img.width, h = img.height
        if (w > h) { if (w > max) { h = Math.round(h*max/w); w = max } }
        else       { if (h > max) { w = Math.round(w*max/h); h = max } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const b64 = canvas.toDataURL('image/jpeg', 0.85)
        setProf(p => ({...p, photoUrl: b64}))
        setDirty(true)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (!data) return <div style={{ ...s.shell, alignItems:'center', justifyContent:'center' }}>Loading...</div>

  const navItems: { key: Section; label: string }[] = [
    { key:'profile',        label:'Profile' },
    { key:'projects',       label:'Projects' },
    { key:'skills',         label:'Skills' },
    { key:'certifications', label:'Certifications' },
    { key:'contact',        label:'Contact' },
  ]

  return (
    <div style={s.shell}>
      {/* SIDEBAR */}
      <aside style={s.aside}>
        <div style={s.logo}>Admin<span style={{color:'#00D4FF'}}>.</span></div>
        {navItems.map(item => (
          <div
            key={item.key}
            onClick={() => setPage(item.key)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:500,
              color: page === item.key ? '#00D4FF' : '#8A94A8',
              background: page === item.key ? 'rgba(0,212,255,0.08)' : 'transparent',
              borderLeft: page === item.key ? '2px solid #00D4FF' : '2px solid transparent',
              transition:'all .15s',
            }}
          >{item.label}</div>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 20px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
          <a href="/" target="_blank" style={{ display:'block', textAlign:'center', background:'#00D4FF', color:'#000', fontSize:12, fontWeight:600, padding:9, borderRadius:7, textDecoration:'none' }}>
            Open Portfolio ↗
          </a>
          <p style={{ fontSize:10, color:'#5A6278', marginTop:8, textAlign:'center', lineHeight:1.5 }}>
            Changes save directly to GitHub
          </p>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{ width:'100%', marginTop:10, background:'rgba(255,92,92,0.12)', border:'0.5px solid rgba(255,92,92,0.25)', color:'#FF5C5C', fontSize:12, fontWeight:600, padding:8, borderRadius:7, cursor:'pointer' }}
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>

        {/* PROFILE */}
        {page === 'profile' && (
          <div>
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Profile</div>
              <div style={{ fontSize:13, color:'#5A6278' }}>Your personal information shown across the portfolio</div>
            </div>

            {/* Stats preview */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
              {[['stat1','stat1label'],['stat2','stat2label'],['stat3','stat3label']].map(([v,l]) => (
                <div key={v} style={{ background:'#161C2D', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:10, padding:16, textAlign:'center' }}>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:26, fontWeight:700, color:'#00D4FF' }}>{prof[v]||'—'}</div>
                  <div style={{ fontSize:11, color:'#5A6278', marginTop:4 }}>{prof[l]||'—'}</div>
                </div>
              ))}
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>Section Visibility</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {['about','skills','projects','certifications','contact'].map(sec => {
                  const on = (data.sectionsVisible || {})[sec] !== false
                  return (
                    <button key={sec} onClick={() => toggleSection(sec)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                        background: on ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)',
                        border: on ? '0.5px solid rgba(0,212,255,0.3)' : '0.5px solid rgba(255,255,255,0.1)',
                        color: on ? '#00D4FF' : '#5A6278' }}>
                      {on ? '👁' : '🚫'} {sec.charAt(0).toUpperCase()+sec.slice(1)}
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize:11, color:'#5A6278', marginTop:10 }}>Click to show/hide entire sections on the portfolio</p>
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>Hero Stats</div>
              <div style={s.row2}>{field('stat1','Stat 1 Value')}{field('stat1label','Stat 1 Label')}</div>
              <div style={s.row2}>{field('stat2','Stat 2 Value')}{field('stat2label','Stat 2 Label')}</div>
              <div style={s.row2}>{field('stat3','Stat 3 Value')}{field('stat3label','Stat 3 Label')}</div>
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>Personal Info</div>
              <div style={s.row2}>{field('name','Full Name')}{field('role','Job Title')}</div>
              <div style={s.row2}>{field('location','Location')}{field('company','Company')}</div>
              <div style={s.row2}>{field('companyPeriod','Company Period')}{field('gpa','GPA')}</div>
              <div style={s.row2}>{field('university','University')}{field('degree','Degree')}</div>
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>About Text</div>
              <div style={s.row1}>
                <div>
                  <label style={s.label}>Paragraph 1</label>
                  <textarea style={{...s.input, minHeight:80, resize:'vertical'}} value={prof.about1||''} onChange={e=>{setProf(p=>({...p,about1:e.target.value}));setDirty(true)}} />
                </div>
                <div>
                  <label style={s.label}>Paragraph 2</label>
                  <textarea style={{...s.input, minHeight:80, resize:'vertical'}} value={prof.about2||''} onChange={e=>{setProf(p=>({...p,about2:e.target.value}));setDirty(true)}} />
                </div>
              </div>
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>Profile Photo</div>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                <button style={{...s.btn,...s.btnPrimary}} onClick={() => document.getElementById('photo-input')!.click()}>
                  Upload Photo
                </button>
                <span style={{ fontSize:12, color:'#5A6278' }}>or</span>
                <input style={{...s.input, flex:1, marginBottom:0}} placeholder="Paste image URL..." value={prof.photoUrl?.startsWith('data:') ? '' : (prof.photoUrl||'')}
                  onChange={e=>{setProf(p=>({...p,photoUrl:e.target.value}));setDirty(true)}} />
              </div>
              <input type="file" id="photo-input" accept="image/*" style={{display:'none'}} onChange={handlePhotoUpload} />
              {prof.photoUrl && (
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <img src={prof.photoUrl} style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(0,212,255,0.3)' }} alt="preview" />
                  <div>
                    <div style={{ fontSize:12, color:'#00E5A0', fontWeight:600 }}>✓ Photo ready</div>
                    <button style={{...s.btn,...s.btnDanger, marginTop:6, padding:'4px 10px', fontSize:11}} onClick={()=>{setProf(p=>({...p,photoUrl:''}));setDirty(true)}}>Remove</button>
                  </div>
                </div>
              )}
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>CV / Portfolio PDF</div>
              <label style={s.label}>File path or URL</label>
              <input style={s.input} placeholder="cv.pdf or https://..." value={prof.cvFile||''} onChange={e=>{setProf(p=>({...p,cvFile:e.target.value}));setDirty(true)}} />
              <p style={{ fontSize:11, color:'#5A6278', marginTop:4 }}>Upload PDF to GitHub repo then enter filename (e.g. <code style={{color:'#00D4FF'}}>cv.pdf</code>)</p>
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {page === 'projects' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
              <div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Projects</div>
                <div style={{ fontSize:13, color:'#5A6278' }}>Add, edit, or remove portfolio projects</div>
              </div>
              <button style={{...s.btn,...s.btnPrimary}} onClick={() => setModal({ type:'project', idx: null, item: { tag:'', tagClass:'scada', title:'', desc:'', chips:'', img:'' } })}>
                + Add Project
              </button>
            </div>
            {(data.projects||[]).map((pr: any, i: number) => (
              <div key={pr.id} style={{...s.listItem, opacity: pr.visible !== false ? 1 : 0.45}}>
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(0,212,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#00D4FF', flexShrink:0 }}>
                  {(pr.images && pr.images[0]) ? <img src={pr.images[0]} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} alt="" /> : i+1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pr.title}</div>
                  <div style={{ fontSize:11, color:'#5A6278', marginTop:2 }}>{pr.tag} · {(pr.images||[]).length} photo{(pr.images||[]).length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                  <button
                    onClick={() => toggleProject(i)}
                    title={pr.visible !== false ? 'Visible — click to hide' : 'Hidden — click to show'}
                    style={{ width:40, height:22, borderRadius:100, border:'none', cursor:'pointer', position:'relative', background: pr.visible !== false ? '#00D4FF' : 'rgba(255,255,255,0.15)', transition:'background .2s' }}
                  >
                    <span style={{ position:'absolute', top:2, left: pr.visible !== false ? 20 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
                  </button>
                  <button style={{...s.btn,...s.btnGhost, padding:'5px 10px', fontSize:11}} onClick={() => setModal({ type:'project', idx:i, item:{ ...pr, chips:(pr.chips||[]).join(', '), images:[...(pr.images||[])] } })}>Edit</button>
                  <button style={{...s.btn,...s.btnDanger, padding:'5px 10px', fontSize:11}} onClick={() => { if(!confirm('Delete?')) return; const p=[...data.projects]; p.splice(i,1); setData((d:any)=>({...d,projects:p})); setDirty(true) }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SKILLS */}
        {page === 'skills' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
              <div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Skills</div>
                <div style={{ fontSize:13, color:'#5A6278' }}>Manage skill groups and tags</div>
              </div>
              <button style={{...s.btn,...s.btnPrimary}} onClick={() => setModal({ type:'skill', idx:null, item:{ group:'', tags:'' } })}>
                + Add Group
              </button>
            </div>
            {(data.skills||[]).map((sk: any, i: number) => (
              <div key={sk.group} style={s.listItem}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{sk.group}</div>
                  <div style={{ fontSize:11, color:'#5A6278', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(sk.tags||[]).join(' · ')}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button style={{...s.btn,...s.btnGhost, padding:'5px 10px', fontSize:11}} onClick={() => setModal({ type:'skill', idx:i, item:{ group:sk.group, tags:(sk.tags||[]).join(', ') } })}>Edit</button>
                  <button style={{...s.btn,...s.btnDanger, padding:'5px 10px', fontSize:11}} onClick={() => { if(!confirm('Delete?')) return; const p=[...data.skills]; p.splice(i,1); setData((d:any)=>({...d,skills:p})); setDirty(true) }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CERTIFICATIONS */}
        {page === 'certifications' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
              <div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Certifications</div>
                <div style={{ fontSize:13, color:'#5A6278' }}>Your credentials</div>
              </div>
              <button style={{...s.btn,...s.btnPrimary}} onClick={() => setModal({ type:'cert', idx:null, item:{ icon:'📜', name:'', issuer:'' } })}>
                + Add Cert
              </button>
            </div>
            {(data.certifications||[]).map((c: any, i: number) => (
              <div key={c.name} style={s.listItem}>
                <div style={{ fontSize:24, flexShrink:0, width:36, textAlign:'center' }}>{c.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#5A6278', marginTop:2 }}>{c.issuer}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button style={{...s.btn,...s.btnGhost, padding:'5px 10px', fontSize:11}} onClick={() => setModal({ type:'cert', idx:i, item:{...c} })}>Edit</button>
                  <button style={{...s.btn,...s.btnDanger, padding:'5px 10px', fontSize:11}} onClick={() => { if(!confirm('Delete?')) return; const p=[...data.certifications]; p.splice(i,1); setData((d:any)=>({...d,certifications:p})); setDirty(true) }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTACT */}
        {page === 'contact' && (
          <div>
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:22, fontWeight:700, marginBottom:4 }}>Contact</div>
              <div style={{ fontSize:13, color:'#5A6278' }}>Links and target companies</div>
            </div>
            <div style={s.panel}>
              <div style={s.panelTitle}>Social Links</div>
              <div style={s.row1}>
                {field('github','GitHub URL')}
                {field('linkedin','LinkedIn URL')}
                {field('email','Email Address','email')}
                {field('whatsapp','WhatsApp (with country code)')}
              </div>
            </div>
            <div style={s.panel}>
              <div style={s.panelTitle}>Target Companies</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:10, background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:7, minHeight:44 }}>
                {(data.targets||[]).map((t: string, i: number) => (
                  <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(0,212,255,0.08)', border:'0.5px solid rgba(0,212,255,0.2)', color:'#00D4FF', fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:100 }}>
                    {t}
                    <button style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:13, lineHeight:1, padding:0, opacity:.7 }}
                      onClick={() => { const p=[...data.targets]; p.splice(i,1); setData((d:any)=>({...d,targets:p})); setDirty(true) }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <input id="target-inp" style={{...s.input, flex:1, marginBottom:0}} placeholder="Add company..."
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return
                    const v = (e.target as HTMLInputElement).value.trim()
                    if (!v) return
                    setData((d: any) => ({...d, targets:[...d.targets, v]}))
                    setDirty(true);
                    (e.target as HTMLInputElement).value = ''
                  }} />
                <button style={{...s.btn,...s.btnGhost}} onClick={() => {
                  const inp = document.getElementById('target-inp') as HTMLInputElement
                  if (!inp.value.trim()) return
                  setData((d: any) => ({...d, targets:[...d.targets, inp.value.trim()]}))
                  setDirty(true); inp.value = ''
                }}>Add</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SAVE BAR */}
      {dirty && (
        <div style={{ position:'fixed', bottom:24, right:32, background:'#161C2D', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:10, padding:'12px 18px', display:'flex', alignItems:'center', gap:12, zIndex:99 }}>
          <span style={{ fontSize:12, color:'#8A94A8' }}>Unsaved changes</span>
          <button style={{...s.btn,...s.btnGhost, padding:'5px 10px', fontSize:11}} onClick={loadData}>Discard</button>
          <button style={{...s.btn,...s.btnPrimary, opacity: saving ? .7 : 1}} onClick={saveAll} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Deploy'}
          </button>
        </div>
      )}

      {/* TOAST */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* MODALS */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if(e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background:'#0F1420', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:14, padding:28, width:'100%', maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:16, fontWeight:700 }}>
                {modal?.idx !== null ? 'Edit' : 'Add'} {modal.type === 'project' ? 'Project' : modal.type === 'skill' ? 'Skill Group' : 'Certification'}
              </div>
              <button style={{ background:'none', border:'none', color:'#8A94A8', cursor:'pointer', fontSize:20 }} onClick={() => setModal(null)}>×</button>
            </div>

            {modal.type === 'project' && (
              <>
                <div style={s.row2}>
                  <div><label style={s.label}>Tag Label</label><input style={s.input} value={modal.item.tag} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,tag:e.target.value}}):m)} /></div>
                  <div><label style={s.label}>Tag Color</label>
                    <select style={{...s.input}} value={modal.item.tagClass} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,tagClass:e.target.value}}):m)}>
                      {[['scada','Blue — SCADA'],['solar','Amber — Solar'],['panel','Green — Panel'],['maint','Purple — Maintenance'],['academic','Red — Academic'],['web','Lime — Web']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={s.row1}><div><label style={s.label}>Title</label><input style={s.input} value={modal.item.title} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,title:e.target.value}}):m)} /></div></div>
                <div style={s.row1}><div><label style={s.label}>Description</label><textarea style={{...s.input,minHeight:80,resize:'vertical'}} value={modal.item.desc} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,desc:e.target.value}}):m)} /></div></div>
                <div style={s.row1}><div><label style={s.label}>Chips (comma separated)</label><input style={s.input} value={modal.item.chips} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,chips:e.target.value}}):m)} /></div></div>
                <div style={{marginBottom:14}}>
                  <label style={s.label}>Project Images ({(modal.item.images||[]).length})</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                    {(modal.item.images||[]).map((img: string, ii: number) => (
                      <div key={ii} style={{ position:'relative', width:80, height:60 }}>
                        <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.13)' }} alt="" />
                        <button
                          onClick={() => setModal((m:any) => m ? ({ ...m, item: { ...m.item, images: (m.item.images||[]).filter((_: string, x: number) => x !== ii) } }) : m)}
                          style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#FF5C5C', color:'#fff', border:'none', fontSize:11, cursor:'pointer', lineHeight:1 }}
                        >×</button>
                      </div>
                    ))}
                    <label style={{ width:80, height:60, border:'1px dashed rgba(0,212,255,0.3)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#00D4FF', fontSize:22 }}>
                      {uploading ? '⏳' : '+'}
                      <input type="file" accept="image/*" multiple style={{display:'none'}}
                        onChange={async e => {
                          const files = Array.from(e.target.files || [])
                          if (!files.length) return
                          setUploading(true)
                          for (const f of files) {
                            const url = await uploadImage(f)
                            if (url) setModal((m:any) => m ? ({ ...m, item: { ...m.item, images: [...(m.item.images||[]), url] } }) : m)
                          }
                          setUploading(false)
                          e.target.value = ''
                        }} />
                    </label>
                  </div>
                  <span style={{ fontSize:10, color:'#5A6278' }}>Click + to upload photos directly. They save to GitHub automatically.</span>
                </div>
              </>
            )}

            {modal.type === 'skill' && (
              <>
                <div style={s.row1}><div><label style={s.label}>Group Name</label><input style={s.input} value={modal.item.group} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,group:e.target.value}}):m)} /></div></div>
                <div style={s.row1}><div><label style={s.label}>Skills (comma separated)</label><input style={s.input} value={modal.item.tags} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,tags:e.target.value}}):m)} /></div></div>
              </>
            )}

            {modal.type === 'cert' && (
              <>
                <div style={s.row2}>
                  <div><label style={s.label}>Icon (emoji)</label><input style={s.input} value={modal.item.icon} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,icon:e.target.value}}):m)} maxLength={4} /></div>
                  <div><label style={s.label}>Name</label><input style={s.input} value={modal.item.name} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,name:e.target.value}}):m)} /></div>
                </div>
                <div style={s.row1}><div><label style={s.label}>Issuer</label><input style={s.input} value={modal.item.issuer} onChange={e=>setModal((m:any)=>m?({...m,item:{...m.item,issuer:e.target.value}}):m)} /></div></div>
              </>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button style={{...s.btn,...s.btnGhost}} onClick={() => setModal(null)}>Cancel</button>
              <button style={{...s.btn,...s.btnPrimary}} onClick={() => {
                const item = modal.item
                if (modal.type === 'project') {
                  const p = { ...item, chips: item.chips.split(',').map((c:string)=>c.trim()).filter(Boolean), images: item.images || [], id: item.id || Date.now() }
                  setData((d:any) => {
                    const arr = [...d.projects]
                    if (modal.idx !== null) arr[modal.idx] = p; else arr.push(p)
                    return {...d, projects:arr}
                  })
                } else if (modal.type === 'skill') {
                  const p = { group: item.group, tags: item.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) }
                  setData((d:any) => {
                    const arr = [...d.skills]
                    if (modal.idx !== null) arr[modal.idx] = p; else arr.push(p)
                    return {...d, skills:arr}
                  })
                } else {
                  setData((d:any) => {
                    const arr = [...d.certifications]
                    if (modal.idx !== null) arr[modal.idx] = item; else arr.push(item)
                    return {...d, certifications:arr}
                  })
                }
                setDirty(true)
                setModal(null)
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
