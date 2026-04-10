import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const rows = await sql`
      SELECT id, name, email, role, active, password_hash
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const user = rows[0]

    if (!user.active) {
      return NextResponse.json({ error: 'Usuario desactivado' }, { status: 403 })
    }

    const verified = await sql`
      SELECT (password_hash = crypt(${password}, password_hash)) as match
      FROM users WHERE id = ${user.id}
    `

    if (!verified[0]?.match) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`

    const sessionId = await createSession(user.id)

    // In Next.js 15 Route Handlers, cookies must be set directly on the response object
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
    })

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
