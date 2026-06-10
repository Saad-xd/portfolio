import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN   = process.env.GITHUB_TOKEN!
const GITHUB_OWNER   = process.env.GITHUB_OWNER!
const GITHUB_REPO    = process.env.GITHUB_REPO!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const FILE_PATH      = 'data/portfolio.json'

// ── Simple brute-force protection (in-memory, per server instance) ──
const attempts = new Map<string, { count: number; lockedUntil: number }>()

function checkAuth(req: NextRequest): { ok: boolean; status: number; error?: string } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rec = attempts.get(ip) || { count: 0, lockedUntil: 0 }

  if (Date.now() < rec.lockedUntil) {
    return { ok: false, status: 429, error: 'Too many attempts. Try again in 5 minutes.' }
  }

  const password = req.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    rec.count += 1
    if (rec.count >= 5) {
      rec.lockedUntil = Date.now() + 5 * 60 * 1000 // lock 5 minutes
      rec.count = 0
    }
    attempts.set(ip, rec)
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  attempts.delete(ip) // success resets counter
  return { ok: true, status: 200 }
}

async function getFileSHA() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.sha as string
}

export async function GET(req: NextRequest) {
  const auth = checkAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const file = await res.json()
  const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
  return NextResponse.json(content)
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data } = await req.json()
  const sha = await getFileSHA()
  if (!sha) return NextResponse.json({ error: 'File not found on GitHub' }, { status: 404 })

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Update portfolio via admin dashboard', content, sha }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
