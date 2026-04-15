import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import DashboardHome from '@/components/dashboard/DashboardHome'

export default async function DashboardPage() {
  const user = await requireAuth()

  const [courses, enrollments, plans, alerts] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM courses WHERE status != 'cancelled'`,
    sql`SELECT COUNT(*) as count FROM enrollments`,
    sql`SELECT COUNT(*) as count FROM postgraduate_plans WHERE status != 'cancelled'`,
    sql`SELECT COUNT(*) as count FROM alerts WHERE resolved=FALSE`,
  ])

  const recentCourses = await sql`
    SELECT c.id, c.name, c.type, c.status, c.start_date, c.end_date,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count,
      c.min_enrollment,
      (SELECT STRING_AGG(t.name, ', ') FROM course_teachers ct JOIN teachers t ON ct.teacher_id=t.id WHERE ct.course_id=c.id) as teachers
    FROM courses c
    WHERE c.status != 'cancelled'
    ORDER BY c.start_date DESC NULLS LAST
    LIMIT 6
  `

  const pendingAlerts = await sql`
    SELECT a.*, c.name as course_name FROM alerts a
    LEFT JOIN courses c ON a.course_id=c.id
    WHERE a.resolved=FALSE
    ORDER BY CASE a.severity WHEN 'danger' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END
    LIMIT 5
  `

  return (
    <DashboardHome
      user={user}
      stats={{
        courses: Number(courses[0].count),
        enrollments: Number(enrollments[0].count),
        plans: Number(plans[0].count),
        alerts: Number(alerts[0].count),
      }}
      recentCourses={recentCourses}
      pendingAlerts={pendingAlerts}
    />
  )
}
