import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id requerido' }, { status: 400 })

  const rows = await sql`
    SELECT e.*, s.name as student_name, s.ci, s.email as student_email, s.workplace, s.position,
      s.academic_degree, g.grade, g.evaluation_date, g.comments as grade_comments
    FROM enrollments e
    JOIN students s ON e.student_id=s.id
    LEFT JOIN grades g ON g.enrollment_id=e.id AND g.evaluation_type='final'
    WHERE e.course_id=${courseId}
    ORDER BY s.name
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator', 'professor'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { course_id, student_id, enrollment_date, notes } = body
  const rows = await sql`
    INSERT INTO enrollments (course_id, student_id, enrollment_date, notes)
    VALUES (${course_id}, ${student_id}, ${enrollment_date || null}, ${notes || null})
    ON CONFLICT (course_id, student_id) DO NOTHING
    RETURNING *
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'El estudiante ya está matriculado en este curso' }, { status: 409 })
  }
  return NextResponse.json(rows[0], { status: 201 })
}
