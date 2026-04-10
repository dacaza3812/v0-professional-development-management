import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const rows = await sql`
    SELECT c.*, u.name as university_name, f.name as faculty_name, p.name as plan_name,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count
    FROM courses c
    JOIN universities u ON c.university_id=u.id
    LEFT JOIN faculties f ON c.faculty_id=f.id
    LEFT JOIN postgraduate_plans p ON c.postgraduate_plan_id=p.id
    WHERE c.id=${id}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const teachers = await sql`
    SELECT t.*, ct.role as course_role FROM course_teachers ct
    JOIN teachers t ON ct.teacher_id=t.id
    WHERE ct.course_id=${id}
  `
  return NextResponse.json({ ...rows[0], teachers })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const {
    name, code, type, modality, hours, credits, start_date, end_date,
    min_enrollment, max_enrollment, status, objectives, content,
    faculty_id, area_id, postgraduate_plan_id
  } = body
  const rows = await sql`
    UPDATE courses SET name=${name}, code=${code || null}, type=${type}, modality=${modality},
    hours=${hours || null}, credits=${credits || null}, start_date=${start_date || null},
    end_date=${end_date || null}, min_enrollment=${min_enrollment || 5},
    max_enrollment=${max_enrollment || null}, status=${status}, objectives=${objectives || null},
    content=${content || null}, faculty_id=${faculty_id || null}, area_id=${area_id || null},
    postgraduate_plan_id=${postgraduate_plan_id || null}, updated_at=NOW()
    WHERE id=${id} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  await sql`UPDATE courses SET status='cancelled', updated_at=NOW() WHERE id=${id}`
  return NextResponse.json({ success: true })
}
