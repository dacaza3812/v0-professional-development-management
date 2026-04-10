import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id requerido' }, { status: 400 })
  const rows = await sql`
    SELECT d.*, t.name as teacher_name
    FROM course_documents d
    LEFT JOIN teachers t ON d.teacher_id=t.id
    WHERE d.course_id=${courseId}
    ORDER BY d.created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator', 'professor'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { course_id, teacher_id, type, name, description, submitted_date } = body
  const rows = await sql`
    INSERT INTO course_documents (course_id, teacher_id, type, name, description, submitted_date, status)
    VALUES (${course_id}, ${teacher_id || null}, ${type}, ${name}, ${description || null}, ${submitted_date || null}, 'submitted')
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
