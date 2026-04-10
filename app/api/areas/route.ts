import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const facultyId = searchParams.get('faculty_id')
  const rows = facultyId
    ? await sql`SELECT a.*, f.name as faculty_name, u.name as university_name FROM areas a JOIN faculties f ON a.faculty_id=f.id JOIN universities u ON f.university_id=u.id WHERE a.faculty_id=${facultyId} ORDER BY a.name`
    : await sql`SELECT a.*, f.name as faculty_name, u.name as university_name FROM areas a JOIN faculties f ON a.faculty_id=f.id JOIN universities u ON f.university_id=u.id ORDER BY u.name, f.name, a.name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { faculty_id, name, code, head } = body
  const rows = await sql`
    INSERT INTO areas (faculty_id, name, code, head)
    VALUES (${faculty_id}, ${name}, ${code}, ${head})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
