import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  await requireAuth()
  const rows = await sql`SELECT * FROM universities ORDER BY name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { name, code, address, phone, email, website, rector } = body
  const rows = await sql`
    INSERT INTO universities (name, code, address, phone, email, website, rector)
    VALUES (${name}, ${code}, ${address}, ${phone}, ${email}, ${website}, ${rector})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
