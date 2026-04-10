import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const rows = search
    ? await sql`SELECT * FROM students WHERE active=TRUE AND (name ILIKE ${'%' + search + '%'} OR ci ILIKE ${'%' + search + '%'}) ORDER BY name LIMIT 50`
    : await sql`SELECT * FROM students WHERE active=TRUE ORDER BY name LIMIT 100`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator', 'professor'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { name, ci, email, phone, workplace, position, academic_degree, university_id, faculty_id } = body
  const rows = await sql`
    INSERT INTO students (name, ci, email, phone, workplace, position, academic_degree, university_id, faculty_id)
    VALUES (${name}, ${ci || null}, ${email || null}, ${phone || null}, ${workplace || null},
            ${position || null}, ${academic_degree || null}, ${university_id || null}, ${faculty_id || null})
    ON CONFLICT (ci) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, updated_at=NOW()
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
