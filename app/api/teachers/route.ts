import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const universityId = searchParams.get('university_id')
  const rows = universityId
    ? await sql`SELECT t.*, u.name as university_name FROM teachers t LEFT JOIN universities u ON t.university_id=u.id WHERE t.university_id=${universityId} ORDER BY t.name`
    : await sql`SELECT t.*, u.name as university_name FROM teachers t LEFT JOIN universities u ON t.university_id=u.id ORDER BY t.name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { university_id, faculty_id, name, ci, email, phone, category, scientific_degree, teaching_category, specialty } = body
  const rows = await sql`
    INSERT INTO teachers (university_id, faculty_id, name, ci, email, phone, category, scientific_degree, teaching_category, specialty)
    VALUES (${university_id || null}, ${faculty_id || null}, ${name}, ${ci || null}, ${email || null},
            ${phone || null}, ${category || null}, ${scientific_degree || null}, ${teaching_category || null}, ${specialty || null})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
