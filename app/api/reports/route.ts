import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const universityId = searchParams.get('university_id')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  // General stats
  const stats = await sql`
    SELECT
      (SELECT COUNT(*) FROM courses c JOIN universities u ON c.university_id=u.id
        WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
        AND EXTRACT(YEAR FROM COALESCE(c.start_date, c.created_at))=${year}) as total_courses,
      (SELECT COUNT(*) FROM courses c
        WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
        AND c.type='plan'
        AND EXTRACT(YEAR FROM COALESCE(c.start_date, c.created_at))=${year}) as plan_courses,
      (SELECT COUNT(*) FROM courses c
        WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
        AND c.type='extraplan'
        AND EXTRACT(YEAR FROM COALESCE(c.start_date, c.created_at))=${year}) as extraplan_courses,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id=c.id
        WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
        AND EXTRACT(YEAR FROM COALESCE(c.start_date, e.enrollment_date))=${year}) as total_enrollments,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id=c.id
        WHERE e.status='approved'
        AND (${universityId}::int IS NULL OR c.university_id=${universityId})) as approved_count,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id=c.id
        WHERE e.status='failed'
        AND (${universityId}::int IS NULL OR c.university_id=${universityId})) as failed_count,
      (SELECT COUNT(*) FROM certificates cert JOIN courses c ON cert.course_id=c.id
        WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
        AND EXTRACT(YEAR FROM cert.issued_date)=${year}) as certificates_issued
  `

  // Courses by faculty
  const byFaculty = await sql`
    SELECT f.name as faculty_name, COUNT(c.id) as course_count,
      SUM((SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id)) as student_count
    FROM courses c
    JOIN faculties f ON c.faculty_id=f.id
    WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
      AND EXTRACT(YEAR FROM COALESCE(c.start_date, c.created_at))=${year}
    GROUP BY f.id, f.name ORDER BY course_count DESC
  `

  // Plan compliance
  const planCompliance = await sql`
    SELECT p.name as plan_name, p.total_courses as planned,
      COUNT(c.id) as actual_courses,
      p.status,
      ROUND(CASE WHEN p.total_courses > 0 THEN (COUNT(c.id)::numeric / p.total_courses * 100) ELSE 0 END, 1) as compliance_pct
    FROM postgraduate_plans p
    LEFT JOIN courses c ON c.postgraduate_plan_id=p.id
    WHERE (${universityId}::int IS NULL OR p.university_id=${universityId}) AND p.year=${year}
    GROUP BY p.id, p.name, p.total_courses, p.status
    ORDER BY compliance_pct DESC
  `

  // Monthly enrollment trend
  const monthlyTrend = await sql`
    SELECT TO_CHAR(e.enrollment_date, 'Mon') as month,
      EXTRACT(MONTH FROM e.enrollment_date) as month_num,
      COUNT(*) as enrollments
    FROM enrollments e
    JOIN courses c ON e.course_id=c.id
    WHERE (${universityId}::int IS NULL OR c.university_id=${universityId})
      AND EXTRACT(YEAR FROM e.enrollment_date)=${year}
    GROUP BY month, month_num ORDER BY month_num
  `

  return NextResponse.json({ stats: stats[0], byFaculty, planCompliance, monthlyTrend, year })
}
