import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN   = process.env.GITHUB_TOKEN!
const GITHUB_OWNER   = process.env.GITHUB_OWNER!
const GITHUB_REPO    = process.env.GITHUB_REPO!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!

function authed(req: NextRequest) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD
}

// POST /api/upload  { filename, base64 }  →  saves to public/images/<filename> on GitHub
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, base64 } = await req.json()
  if (!filename || !base64) {
    return NextResponse.json({ error: 'filename and base64 required' }, { status: 400 })
  }

  // sanitize filename
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `public/images/${safe}`

  // check if file exists (need SHA to overwrite)
  let sha: string | undefined
  const check = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, cache: 'no-store' }
  )
  if (check.ok) {
    const existing = await check.json()
    sha = existing.sha
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Upload image: ${safe}`,
        content: base64, // raw base64 WITHOUT the data:image prefix
        ...(sha ? { sha } : {}),
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: `/images/${safe}` })
}
