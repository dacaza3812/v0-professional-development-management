import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator', 'professor'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const { name, ci, email, phone, workplace, position, academic_degree, university_id, faculty_id, active } = body
  const rows = await sql`
    UPDATE students SET name=${name}, ci=${ci || null}, email=${email || null}, phone=${phone || null},
      workplace=${workplace || null}, position=${position || null}, academic_degree=${academic_degree || null},
      university_id=${university_id || null}, faculty_id=${faculty_id || null},
      active=${active !== false}, updated_at=NOW()
    WHERE id=${id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
