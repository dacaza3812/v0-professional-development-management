import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import CourseDetail from '@/components/dashboard/CourseDetail'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [courseRows, enrollments, documents] = await Promise.all([
    sql`
      SELECT c.*, u.name as university_name, f.name as faculty_name, p.name as plan_name
      FROM courses c
      JOIN universities u ON c.university_id=u.id
      LEFT JOIN faculties f ON c.faculty_id=f.id
      LEFT JOIN postgraduate_plans p ON c.postgraduate_plan_id=p.id
      WHERE c.id=${id}
    `,
    sql`
      SELECT e.*, s.name as student_name, s.ci, s.email as student_email, s.workplace, s.position,
        g.grade, g.evaluation_date, g.id as grade_id
      FROM enrollments e
      JOIN students s ON e.student_id=s.id
      LEFT JOIN grades g ON g.enrollment_id=e.id AND g.evaluation_type='final'
      WHERE e.course_id=${id}
      ORDER BY s.name
    `,
    sql`
      SELECT d.*, t.name as teacher_name FROM course_documents d
      LEFT JOIN teachers t ON d.teacher_id=t.id
      WHERE d.course_id=${id}
      ORDER BY d.created_at DESC
    `,
  ])

  if (courseRows.length === 0) notFound()

  const teachers = await sql`
    SELECT t.*, ct.role as course_role FROM course_teachers ct
    JOIN teachers t ON ct.teacher_id=t.id
    WHERE ct.course_id=${id}
  `

  return (
    <CourseDetail
      course={courseRows[0]}
      teachers={teachers}
      enrollments={enrollments}
      documents={documents}
    />
  )
}
