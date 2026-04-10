import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const universityId = searchParams.get('university_id')
  const rows = universityId
    ? await sql`
        SELECT p.*, u.name as university_name, f.name as faculty_name, a.name as area_name,
          (SELECT COUNT(*) FROM courses c WHERE c.postgraduate_plan_id = p.id) as courses_count
        FROM postgraduate_plans p
        JOIN universities u ON p.university_id=u.id
        LEFT JOIN faculties f ON p.faculty_id=f.id
        LEFT JOIN areas a ON p.area_id=a.id
        WHERE p.university_id=${universityId}
        ORDER BY p.year DESC, p.name
      `
    : await sql`
        SELECT p.*, u.name as university_name, f.name as faculty_name, a.name as area_name,
          (SELECT COUNT(*) FROM courses c WHERE c.postgraduate_plan_id = p.id) as courses_count
        FROM postgraduate_plans p
        JOIN universities u ON p.university_id=u.id
        LEFT JOIN faculties f ON p.faculty_id=f.id
        LEFT JOIN areas a ON p.area_id=a.id
        ORDER BY p.year DESC, p.name
      `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { university_id, faculty_id, area_id, name, code, year, start_date, end_date, description, total_courses } = body
  const rows = await sql`
    INSERT INTO postgraduate_plans (university_id, faculty_id, area_id, name, code, year, start_date, end_date, description, total_courses, created_by)
    VALUES (${university_id}, ${faculty_id || null}, ${area_id || null}, ${name}, ${code}, ${year},
            ${start_date || null}, ${end_date || null}, ${description}, ${total_courses || 0}, ${user.id})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
