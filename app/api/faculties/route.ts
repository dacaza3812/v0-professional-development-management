import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const universityId = searchParams.get('university_id')
  const rows = universityId
    ? await sql`SELECT f.*, u.name as university_name FROM faculties f JOIN universities u ON f.university_id=u.id WHERE f.university_id=${universityId} ORDER BY f.name`
    : await sql`SELECT f.*, u.name as university_name FROM faculties f JOIN universities u ON f.university_id=u.id ORDER BY u.name, f.name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { university_id, name, code, dean, email, phone } = body
  const rows = await sql`
    INSERT INTO faculties (university_id, name, code, dean, email, phone)
    VALUES (${university_id}, ${name}, ${code}, ${dean}, ${email}, ${phone})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
