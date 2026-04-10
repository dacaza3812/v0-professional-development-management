import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const rows = await sql`
    SELECT p.*, u.name as university_name, f.name as faculty_name, a.name as area_name
    FROM postgraduate_plans p
    JOIN universities u ON p.university_id=u.id
    LEFT JOIN faculties f ON p.faculty_id=f.id
    LEFT JOIN areas a ON p.area_id=a.id
    WHERE p.id=${id}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const { name, code, year, start_date, end_date, description, status, total_courses, faculty_id, area_id } = body
  const rows = await sql`
    UPDATE postgraduate_plans SET name=${name}, code=${code}, year=${year}, start_date=${start_date || null},
    end_date=${end_date || null}, description=${description}, status=${status},
    total_courses=${total_courses || 0}, faculty_id=${faculty_id || null}, area_id=${area_id || null}, updated_at=NOW()
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
  await sql`DELETE FROM postgraduate_plans WHERE id=${id}`
  return NextResponse.json({ success: true })
}
