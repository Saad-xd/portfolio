import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN!
const GITHUB_OWNER  = process.env.GITHUB_OWNER!
const GITHUB_REPO   = process.env.GITHUB_REPO!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const FILE_PATH     = 'data/portfolio.json'

async function getFileSHA() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.sha as string
}

export async function POST(req: NextRequest) {
  const { password, data } = await req.json()

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sha = await getFileSHA()
  if (!sha) return NextResponse.json({ error: 'File not found on GitHub' }, { status: 404 })

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update portfolio data via admin dashboard',
        content,
        sha,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, next: { revalidate: 0 } }
  )
  const file = await res.json()
  const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
  return NextResponse.json(content)
}
