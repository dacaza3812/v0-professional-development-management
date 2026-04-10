import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')
  const studentId = searchParams.get('student_id')

  let rows
  if (courseId) {
    rows = await sql`
      SELECT cert.*, s.name as student_name, s.ci, c.name as course_name, u.name as university_name
      FROM certificates cert
      JOIN students s ON cert.student_id=s.id
      JOIN courses c ON cert.course_id=c.id
      JOIN universities u ON c.university_id=u.id
      WHERE cert.course_id=${courseId}
      ORDER BY s.name
    `
  } else if (studentId) {
    rows = await sql`
      SELECT cert.*, s.name as student_name, c.name as course_name
      FROM certificates cert
      JOIN students s ON cert.student_id=s.id
      JOIN courses c ON cert.course_id=c.id
      WHERE cert.student_id=${studentId}
      ORDER BY cert.issued_date DESC
    `
  } else {
    rows = []
  }
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { enrollment_id, student_id, course_id, grade, notes } = body

  // Generate certificate number
  const year = new Date().getFullYear()
  const countRows = await sql`SELECT COUNT(*) as cnt FROM certificates WHERE EXTRACT(YEAR FROM issued_date)=${year}`
  const count = parseInt(String(countRows[0].cnt)) + 1
  const certNumber = `CERT-${year}-${String(count).padStart(4, '0')}`

  const rows = await sql`
    INSERT INTO certificates (enrollment_id, student_id, course_id, certificate_number, grade, issued_by, notes)
    VALUES (${enrollment_id}, ${student_id}, ${course_id}, ${certNumber}, ${grade || null}, ${user.id}, ${notes || null})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
