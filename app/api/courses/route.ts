import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('plan_id')
  const universityId = searchParams.get('university_id')
  const type = searchParams.get('type')

  let rows
  if (planId) {
    rows = await sql`
      SELECT c.*, u.name as university_name, f.name as faculty_name, p.name as plan_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count,
        (SELECT STRING_AGG(t.name, ', ') FROM course_teachers ct JOIN teachers t ON ct.teacher_id=t.id WHERE ct.course_id=c.id) as teachers
      FROM courses c
      JOIN universities u ON c.university_id=u.id
      LEFT JOIN faculties f ON c.faculty_id=f.id
      LEFT JOIN postgraduate_plans p ON c.postgraduate_plan_id=p.id
      WHERE c.postgraduate_plan_id=${planId}
      ORDER BY c.start_date, c.name
    `
  } else if (universityId) {
    rows = await sql`
      SELECT c.*, u.name as university_name, f.name as faculty_name, p.name as plan_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count,
        (SELECT STRING_AGG(t.name, ', ') FROM course_teachers ct JOIN teachers t ON ct.teacher_id=t.id WHERE ct.course_id=c.id) as teachers
      FROM courses c
      JOIN universities u ON c.university_id=u.id
      LEFT JOIN faculties f ON c.faculty_id=f.id
      LEFT JOIN postgraduate_plans p ON c.postgraduate_plan_id=p.id
      WHERE c.university_id=${universityId} ${type ? sql`AND c.type=${type}` : sql``}
      ORDER BY c.start_date, c.name
    `
  } else {
    rows = await sql`
      SELECT c.*, u.name as university_name, f.name as faculty_name, p.name as plan_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count,
        (SELECT STRING_AGG(t.name, ', ') FROM course_teachers ct JOIN teachers t ON ct.teacher_id=t.id WHERE ct.course_id=c.id) as teachers
      FROM courses c
      JOIN universities u ON c.university_id=u.id
      LEFT JOIN faculties f ON c.faculty_id=f.id
      LEFT JOIN postgraduate_plans p ON c.postgraduate_plan_id=p.id
      ORDER BY c.start_date, c.name
    `
  }
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const {
    postgraduate_plan_id, university_id, faculty_id, area_id, name, code, type,
    modality, hours, credits, start_date, end_date, min_enrollment, max_enrollment,
    objectives, content
  } = body
  const rows = await sql`
    INSERT INTO courses (postgraduate_plan_id, university_id, faculty_id, area_id, name, code, type,
      modality, hours, credits, start_date, end_date, min_enrollment, max_enrollment, objectives, content, created_by)
    VALUES (${postgraduate_plan_id || null}, ${university_id}, ${faculty_id || null}, ${area_id || null},
      ${name}, ${code || null}, ${type}, ${modality}, ${hours || null}, ${credits || null},
      ${start_date || null}, ${end_date || null}, ${min_enrollment || 5}, ${max_enrollment || null},
      ${objectives || null}, ${content || null}, ${user.id})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
