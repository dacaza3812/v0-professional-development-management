'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, BookOpen, Users, Calendar } from 'lucide-react'

interface Plan {
  id: number; name: string; code: string; year: number; status: string;
  total_courses: number; description: string | null;
  university_name: string; faculty_name: string | null; area_name: string | null;
  start_date: string | null; end_date: string | null; created_at: string
}

interface Course {
  id: number; name: string; code: string; type: string; modality: string; status: string;
  hours: number | null; start_date: string | null; end_date: string | null;
  faculty_name: string | null; enrolled_count: number; teachers: string | null; min_enrollment: number
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', completed: 'Completado', cancelled: 'Cancelado'
}
const statusColors: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground', active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700', cancelled: 'bg-red-50 text-red-700'
}
const courseStatusLabels: Record<string, string> = {
  planned: 'Planificado', open: 'Abierto', in_progress: 'En curso',
  completed: 'Finalizado', cancelled: 'Cancelado'
}
const courseStatusColors: Record<string, string> = {
  planned: 'bg-secondary text-muted-foreground', open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700'
}

export default function PlanDetail({ plan, courses }: { plan: Plan; courses: Course[] }) {
  const planCourses = courses.filter(c => c.type === 'plan')
  const extraplanCourses = courses.filter(c => c.type === 'extraplan')
  const totalEnrollments = courses.reduce((sum, c) => sum + Number(c.enrolled_count), 0)
  const completedCourses = courses.filter(c => c.status === 'completed').length
  const compliancePct = plan.total_courses > 0
    ? Math.round((courses.length / plan.total_courses) * 100)
    : 0

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/panel/plans" className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-serif text-2xl font-normal">{plan.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[plan.status]}`}>
              {statusLabels[plan.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {plan.university_name}
            {plan.faculty_name ? ` · ${plan.faculty_name}` : ''}
            {plan.area_name ? ` · ${plan.area_name}` : ''}
            {' · '}{plan.year}
          </p>
        </div>
      </div>

      {/* Plan Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-0.5">Código</div>
          <div className="text-sm font-mono font-medium">{plan.code}</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-0.5">Cursos registrados</div>
          <div className="text-sm font-medium">{courses.length} / {plan.total_courses} planificados</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-0.5">Cumplimiento</div>
          <div className={`text-sm font-medium ${compliancePct >= 90 ? 'text-green-700' : compliancePct >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
            {compliancePct}%
          </div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-0.5">Total matriculados</div>
          <div className="text-sm font-medium">{totalEnrollments}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Progreso del plan</h2>
          <span className="text-xs text-muted-foreground">{courses.length} de {plan.total_courses} cursos</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(compliancePct, 100)}%`,
              backgroundColor: compliancePct >= 90 ? 'hsl(142, 71%, 45%)' : compliancePct >= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--destructive))'
            }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Plan', count: planCourses.length, icon: BookOpen },
            { label: 'Extraplan', count: extraplanCourses.length, icon: BookOpen },
            { label: 'Completados', count: completedCourses, icon: Calendar },
            { label: 'Matrículas', count: totalEnrollments, icon: Users },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-xl font-light">{item.count}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-sm">Cursos del plan</h2>
          <Link
            href={`/panel/courses?plan_id=${plan.id}`}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Ver todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-border rounded-xl bg-secondary/20">
            <BookOpen className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay cursos asociados a este plan</p>
            <p className="text-xs mt-1">Puede crear cursos y asociarlos desde la sección de Cursos</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Profesor(es)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Inicio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Matrícula</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map(course => {
                    const enrolled = Number(course.enrolled_count)
                    const isLow = enrolled < course.min_enrollment && course.status !== 'completed'
                    return (
                      <tr key={course.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/panel/courses/${course.id}`}
                            className="font-medium hover:text-accent transition-colors flex items-center gap-1"
                          >
                            {course.name}
                            <ChevronRight className="w-3 h-3 opacity-50" />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                            {course.type === 'plan' ? 'Plan' : 'Extraplan'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{course.teachers || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {course.start_date ? new Date(course.start_date).toLocaleDateString('es-CU') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${isLow ? 'text-amber-600' : ''}`}>
                            {enrolled}/{course.min_enrollment}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${courseStatusColors[course.status]}`}>
                            {courseStatusLabels[course.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {plan.description && (
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Descripción</h3>
          <p className="text-sm leading-relaxed">{plan.description}</p>
        </div>
      )}
    </div>
  )
}
