import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value

  if (sessionId) {
    await deleteSession(sessionId)
  }

  // In Next.js 15 Route Handlers, cookies must be cleared directly on the response object
  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_id')
  return response
}
