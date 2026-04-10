import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.active, u.last_login, u.created_at,
      univ.name as university_name, f.name as faculty_name
    FROM users u
    LEFT JOIN universities univ ON u.university_id=univ.id
    LEFT JOIN faculties f ON u.faculty_id=f.id
    ORDER BY u.name
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!['superadmin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const body = await req.json()
  const { name, email, password, role, university_id, faculty_id } = body
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role, university_id, faculty_id)
    VALUES (${name}, ${email.toLowerCase()}, crypt(${password}, gen_salt('bf')), ${role},
            ${university_id || null}, ${faculty_id || null})
    RETURNING id, name, email, role, active, created_at
  `
  return NextResponse.json(rows[0], { status: 201 })
}
