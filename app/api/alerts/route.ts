import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const universityId = searchParams.get('university_id')

  // Auto-generate alerts for courses starting soon with insufficient enrollment
  const startingSoon = await sql`
    SELECT c.id, c.name, c.start_date, c.min_enrollment,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled
    FROM courses c
    WHERE c.status IN ('planned','open')
      AND c.start_date IS NOT NULL
      AND c.start_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      AND (${universityId}::int IS NULL OR c.university_id=${universityId})
  `

  for (const course of startingSoon) {
    const enrolled = parseInt(String(course.enrolled))
    const minEnroll = parseInt(String(course.min_enrollment))
    if (enrolled < minEnroll) {
      const daysUntil = Math.ceil((new Date(course.start_date).getTime() - Date.now()) / 86400000)
      await sql`
        INSERT INTO alerts (university_id, course_id, type, message, severity)
        VALUES (
          (SELECT university_id FROM courses WHERE id=${course.id}),
          ${course.id},
          'low_enrollment',
          ${`El curso "${course.name}" inicia en ${daysUntil} días pero solo tiene ${enrolled} de ${minEnroll} matriculados requeridos.`},
          ${enrolled === 0 ? 'danger' : 'warning'}
        )
        ON CONFLICT DO NOTHING
      `
    }
  }

  // Return unresolved alerts
  const alerts = await sql`
    SELECT a.*, c.name as course_name, c.start_date
    FROM alerts a
    LEFT JOIN courses c ON a.course_id=c.id
    WHERE a.resolved=FALSE
      AND (${universityId}::int IS NULL OR a.university_id=${universityId})
    ORDER BY CASE a.severity WHEN 'danger' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, a.created_at DESC
    LIMIT 50
  `
  return NextResponse.json(alerts)
}

export async function PATCH(req: NextRequest) {
  const user = await requireAuth()
  const body = await req.json()
  const { id } = body
  await sql`UPDATE alerts SET resolved=TRUE, resolved_at=NOW(), resolved_by=${user.id} WHERE id=${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (id) {
    await sql`DELETE FROM alerts WHERE id=${id}`
  }
  
  return NextResponse.json({ success: true })
}
