'use client'
import { useState } from 'react'

interface PortfolioData {
  profile: Record<string, string>
  skills: { group: string; tags: string[] }[]
  projects: { id: number; tag: string; tagClass: string; title: string; desc: string; chips: string[]; images?: string[]; img?: string; visible?: boolean }[]
  certifications: { icon: string; name: string; issuer: string }[]
  targets: string[]
  sectionsVisible?: Record<string, boolean>
}

function ImageSlider({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return (
    <div className="project-img-placeholder">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span>Photo coming soon</span>
    </div>
  )
  return (
    <div className="slider">
      <img className="project-img" src={images[idx]} alt={`${title} ${idx+1}`} />
      {images.length > 1 && (
        <>
          <button className="slider-btn slider-prev" onClick={() => setIdx((idx - 1 + images.length) % images.length)}>‹</button>
          <button className="slider-btn slider-next" onClick={() => setIdx((idx + 1) % images.length)}>›</button>
          <div className="slider-dots">
            {images.map((_, i) => (
              <span key={i} className={`slider-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PortfolioClient({ data }: { data: PortfolioData }) {
  const { profile: p, skills, projects, certifications, targets } = data
  const [menuOpen, setMenuOpen] = useState(false)
  const sv = data.sectionsVisible || {}
  const show = (s: string) => sv[s] !== false
  const visibleProjects = projects.filter(pr => pr.visible !== false)
  const navSections = ['about','skills','projects','certifications'].filter(show)
  const nameParts = (p.name || '').trim().split(' ')
  const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]

  return (
    <>
      {/* NAV */}
      <nav>
        <span className="nav-logo">MS<span>.</span></span>
        <ul className="nav-links">
          {[...navSections, ...(show('contact') ? ['contact'] : [])].map(s => (
            <li key={s}><a href={`#${s}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</a></li>
          ))}
        </ul>
        <a href="#contact" className="nav-cta">Hire me</a>
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navSections.map(s => (
          <a key={s} href={`#${s}`} onClick={() => setMenuOpen(false)}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </a>
        ))}
        <a href="#contact" onClick={() => setMenuOpen(false)}>Hire me</a>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-glow" />
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">Available for opportunities in Saudi Arabia &amp; GCC</div>
            <h1 className="hero-name">
              {firstName}<br/>
              <span className="highlight">{lastName}</span>
            </h1>
            <p className="hero-role">{p.role}</p>
            <p className="hero-desc">Specializing in SCADA systems, irrigation automation, solar energy integration, and industrial control panel design. Building reliable infrastructure across Saudi Arabia.</p>
            <div className="hero-ctas">
              <a href="#projects" className="btn-primary">View my work</a>
              <a href="#contact" className="btn-ghost">Get in touch</a>
              {p.cvFile && (
                <a href={p.cvFile} download className="btn-ghost">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download CV
                </a>
              )}
            </div>
            <div className="hero-stats">
              {[['stat1','stat1label'],['stat2','stat2label'],['stat3','stat3label']].map(([v,l]) => (
                <div key={v} className="stat">
                  <div className="stat-num">{p[v]}</div>
                  <div className="stat-label">{p[l]}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="hero-card">
              <div className="hero-avatar">
                {p.photoUrl
                  ? <img src={p.photoUrl} alt={p.name} />
                  : <span>{p.name?.split(' ').map((w:string)=>w[0]).slice(0,2).join('')}</span>}
              </div>
              <div className="hero-card-name">{p.name}</div>
              <div className="hero-card-title">{p.role}</div>
              <div className="hero-card-divider" />
              {[
                { icon: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>, text: p.location },
                { icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>, text: `${p.company} · Mar 2025` },
                { icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>, text: `${p.university} · GPA ${p.gpa}` },
              ].map((item, i) => (
                <div key={i} className="hero-card-item">
                  <div className="hero-card-item-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="1.8">{item.icon}</svg>
                  </div>
                  {item.text}
                </div>
              ))}
              <div className="hero-card-divider" />
              <div className="badge-row">
                {['SCADA','Solar','Control Panels','SOLIDWORKS','PLC'].map(b => (
                  <span key={b} className="badge">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      {show('about') && <section id="about">
        <div className="about-grid">
          <div>
            <div className="section-label">About me</div>
            <h2 className="section-title">Engineering systems that run without failure</h2>
            <p className="section-sub">{p.about1}</p>
            <p style={{ fontSize:15, color:'var(--text2)', marginTop:20, lineHeight:1.8 }}>{p.about2}</p>
          </div>
          <div>
            <div className="exp-block">
              <div className="exp-header">
                <div className="exp-logo">HE</div>
                <div>
                  <div className="exp-company">{p.company}</div>
                  <div className="exp-period">{p.companyPeriod}</div>
                </div>
              </div>
              <div className="exp-role">Automation Control Engineer</div>
              {['SCADA operations with Motorola ICC & ICC Pro','Control panel design, assembly, wiring & testing','Solar energy integration at 20+ remote sites','Preventive maintenance across 103+ irrigation sites','Procurement, BOQ preparation & team supervision'].map(item => (
                <div key={item} className="exp-item">{item}</div>
              ))}
            </div>
            <div className="edu-block">
              <div className="edu-uni">{p.university}</div>
              <div className="edu-degree">{p.degree}</div>
              <span className="edu-gpa">GPA {p.gpa} / 4.00 — Very Good</span>
            </div>
          </div>
        </div>
      </section>}

      {/* SKILLS */}
      {show('skills') && <section id="skills">
        <div className="skills-content">
          <div className="skills-header">
            <div className="section-label">Expertise</div>
            <h2 className="section-title">Core skills</h2>
          </div>
          <div className="skills-groups">
            {skills.map(s => (
              <div key={s.group} className="skill-group">
                <div className="skill-group-title">{s.group}</div>
                <div className="skill-tags">
                  {s.tags.map(t => <span key={t} className="skill-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* PROJECTS */}
      {show('projects') && <section id="projects">
        <div className="projects-content">
          <div className="section-label">Portfolio</div>
          <h2 className="section-title">Featured projects</h2>
          <p className="section-sub">Real-world engineering deployments and digital projects across automation, solar energy, and web development.</p>
          <div className="projects-grid">
            {visibleProjects.map(pr => (
              <div key={pr.id} className="project-card">
                <ImageSlider images={pr.images || (pr.img ? [pr.img] : [])} title={pr.title} />
                <span className={`project-tag tag-${pr.tagClass}`}>{pr.tag}</span>
                <div className="project-title">{pr.title}</div>
                <div className="project-desc">{pr.desc}</div>
                <div className="project-meta">
                  {pr.chips.map(c => <span key={c} className="project-chip">{c}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* CERTIFICATIONS */}
      {show('certifications') && <section id="certifications">
        <div className="certs-content">
          <div className="section-label">Credentials</div>
          <h2 className="section-title">Certifications</h2>
          <div className="certs-grid">
            {certifications.map(c => (
              <div key={c.name} className="cert-card">
                <div className="cert-icon">{c.icon}</div>
                <div>
                  <div className="cert-name">{c.name}</div>
                  <div className="cert-issuer">{c.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* CONTACT */}
      {show('contact') && <section id="contact">
        <div className="contact-content">
          <div>
            <div className="section-label">Let's connect</div>
            <h2 className="section-title">Open to new opportunities</h2>
            <p className="section-sub">Looking for Automation Engineer, SCADA Engineer, or Control Systems Engineer roles across Saudi Arabia and the GCC.</p>
            {p.cvFile && (
              <a href={p.cvFile} download style={{ marginTop:20, display:'inline-flex', alignItems:'center', gap:6 }} className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download CV / Portfolio PDF
              </a>
            )}
            <div className="target-companies">
              <div className="target-title">Target companies</div>
              <div className="company-grid">
                {targets.map(t => <span key={t} className="company-chip">{t}</span>)}
              </div>
            </div>
          </div>
          <div>
            <div className="contact-links">
              {[
                { key:'github',   label:'GitHub',    href: p.github,                         val: p.github?.replace('https://',''),    icon: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/> },
                { key:'linkedin', label:'LinkedIn',  href: p.linkedin,                        val: p.linkedin?.replace('https://',''),  icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></> },
                { key:'email',    label:'Email',     href: `mailto:${p.email}`,               val: p.email,                             icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></> },
                { key:'whatsapp', label:'WhatsApp',  href: `https://wa.me/${p.whatsapp}`,     val: `+${p.whatsapp}`,                   icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
              ].map(link => link.href && (
                <a key={link.key} href={link.href} className="contact-link" target="_blank" rel="noreferrer">
                  <div className="contact-link-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="1.8">{link.icon}</svg>
                  </div>
                  <div>
                    <div className="contact-link-label">{link.label}</div>
                    <div className="contact-link-value">{link.val}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* FOOTER */}
      <footer>
        <span>© 2025 {p.name}</span>
        <span>{p.role} · {p.location}</span>
        <a href={p.github} target="_blank" rel="noreferrer">{p.github?.replace('https://','')}</a>
      </footer>
    </>
  )
}
