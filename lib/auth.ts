import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import sql from './db'
import { randomBytes } from 'crypto'

export type UserRole = 'superadmin' | 'admin' | 'coordinator' | 'professor' | 'viewer'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: UserRole
  university_id: number | null
  faculty_id: number | null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) return null

  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.university_id, u.faculty_id
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
      AND u.active = TRUE
    LIMIT 1
  `
  if (rows.length === 0) return null
  return rows[0] as SessionUser
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) redirect('/login')
  return user
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `

  return sessionId
}

export async function deleteSession(sessionId: string) {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`
}

export async function hasPermission(
  role: UserRole,
  resource: string,
  action: 'can_read' | 'can_create' | 'can_update' | 'can_delete'
): Promise<boolean> {
  const rows = await sql`
    SELECT ${sql.unsafe(action)} as allowed
    FROM role_permissions
    WHERE role = ${role} AND resource = ${resource}
    LIMIT 1
  `
  if (rows.length === 0) return false
  return rows[0].allowed === true
}
