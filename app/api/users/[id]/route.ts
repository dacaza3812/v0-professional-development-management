import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const { name, email, password, role, university_id, faculty_id, active } = body

  if (password && password.length > 0) {
    const rows = await sql`
      UPDATE users SET name=${name}, email=${email.toLowerCase()}, role=${role},
        university_id=${university_id || null}, faculty_id=${faculty_id || null},
        active=${active !== false}, password_hash=crypt(${password}, gen_salt('bf')), updated_at=NOW()
      WHERE id=${id}
      RETURNING id, name, email, role, active, university_id, faculty_id
    `
    return NextResponse.json(rows[0])
  } else {
    const rows = await sql`
      UPDATE users SET name=${name}, email=${email.toLowerCase()}, role=${role},
        university_id=${university_id || null}, faculty_id=${faculty_id || null},
        active=${active !== false}, updated_at=NOW()
      WHERE id=${id}
      RETURNING id, name, email, role, active, university_id, faculty_id
    `
    return NextResponse.json(rows[0])
  }
}
