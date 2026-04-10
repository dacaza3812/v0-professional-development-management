import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator', 'professor'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { enrollment_id, grade, evaluation_type, evaluation_date, comments } = body

  // Upsert grade
  const rows = await sql`
    INSERT INTO grades (enrollment_id, grade, evaluation_type, evaluation_date, comments, graded_by)
    VALUES (${enrollment_id}, ${grade}, ${evaluation_type || 'final'}, ${evaluation_date || null}, ${comments || null}, ${user.id})
    ON CONFLICT (enrollment_id) DO UPDATE SET grade=EXCLUDED.grade, evaluation_date=EXCLUDED.evaluation_date,
    comments=EXCLUDED.comments, graded_by=EXCLUDED.graded_by, updated_at=NOW()
    RETURNING *
  `

  // Update enrollment status based on grade
  if (grade !== null && grade !== undefined) {
    const status = grade >= 70 ? 'approved' : 'failed'
    await sql`UPDATE enrollments SET status=${status}, updated_at=NOW() WHERE id=${enrollment_id}`
  }

  return NextResponse.json(rows[0], { status: 201 })
}
