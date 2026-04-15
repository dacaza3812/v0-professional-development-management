import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { notFound } from 'next/navigation'
import PlanDetail from '@/components/dashboard/PlanDetail'

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [planRows, courses] = await Promise.all([
    sql`
      SELECT p.*, u.name as university_name, f.name as faculty_name, a.name as area_name
      FROM postgraduate_plans p
      JOIN universities u ON p.university_id=u.id
      LEFT JOIN faculties f ON p.faculty_id=f.id
      LEFT JOIN areas a ON p.area_id=a.id
      WHERE p.id=${id}
    `,
    sql`
      SELECT c.*, f.name as faculty_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) as enrolled_count,
        (SELECT STRING_AGG(t.name, ', ') FROM course_teachers ct JOIN teachers t ON ct.teacher_id=t.id WHERE ct.course_id=c.id) as teachers
      FROM courses c
      LEFT JOIN faculties f ON c.faculty_id=f.id
      WHERE c.postgraduate_plan_id=${id}
      ORDER BY c.start_date, c.name
    `,
  ])

  if (planRows.length === 0) notFound()

  return <PlanDetail plan={planRows[0]} courses={courses} />
}
