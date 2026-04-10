import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  if (!['superadmin', 'admin', 'coordinator'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const { name, code, head, active } = body
  const rows = await sql`
    UPDATE areas SET name=${name}, code=${code}, head=${head}, active=${active}, updated_at=NOW()
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
  await sql`UPDATE areas SET active=FALSE, updated_at=NOW() WHERE id=${id}`
  return NextResponse.json({ success: true })
}
