'use client'

import Link from 'next/link'
import { BookOpen, Users, BarChart3, Bell, AlertTriangle, Info, ChevronRight } from 'lucide-react'
import type { SessionUser } from '@/lib/auth'

interface Props {
  user: SessionUser
  stats: { courses: number; enrollments: number; plans: number; alerts: number }
  recentCourses: Array<{
    id: number; name: string; type: string; status: string;
    start_date: string | null; end_date: string | null;
    enrolled_count: number; min_enrollment: number; teachers: string | null
  }>
  pendingAlerts: Array<{
    id: number; message: string; severity: string; course_name: string | null; created_at: string
  }>
}

const statusLabels: Record<string, string> = {
  planned: 'Planificado', open: 'Abierto', in_progress: 'En curso',
  completed: 'Finalizado', cancelled: 'Cancelado',
}
const statusColors: Record<string, string> = {
  planned: 'bg-secondary text-muted-foreground',
  open: 'bg-accent/10 text-accent',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default function DashboardHome({ user, stats, recentCourses, pendingAlerts }: Props) {
  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-balance">
          Bienvenido, {user.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sistema de Gestión de Superación Profesional
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
{ label: 'Cursos activos', value: stats.courses, icon: BookOpen, href: '/panel/courses' },
          { label: 'Matrículas totales', value: stats.enrollments, icon: Users, href: '/panel/enrollments' },
          { label: 'Planes de posgrado', value: stats.plans, icon: BarChart3, href: '/panel/plans' },
          { label: 'Alertas pendientes', value: stats.alerts, icon: Bell, href: '/panel/alerts', urgent: stats.alerts > 0 },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`p-5 rounded-lg border transition-all hover:shadow-sm group ${
              stat.urgent && stat.value > 0
                ? 'border-amber-200 bg-amber-50'
                : 'border-border bg-card hover:border-accent/20'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.urgent && stat.value > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div className={`text-3xl font-semibold mb-0.5 ${stat.urgent && stat.value > 0 ? 'text-amber-700' : ''}`}>
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent courses */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Cursos recientes</h2>
            <Link href="/panel/courses" className="text-xs text-accent hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-border">
            {recentCourses.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No hay cursos registrados</div>
            ) : (
              recentCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/panel/courses/${course.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{course.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[course.status]}`}>
                        {statusLabels[course.status]}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                        {course.type === 'plan' ? 'Plan' : 'Extraplan'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {course.teachers || 'Sin profesor asignado'} •{' '}
                      {course.enrolled_count} matriculados
                      {Number(course.enrolled_count) < course.min_enrollment && course.status !== 'completed' && (
                        <span className="text-amber-600 ml-1">(mín. {course.min_enrollment})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {course.start_date ? new Date(course.start_date).toLocaleDateString('es-CU', { day: '2-digit', month: 'short' }) : '—'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Alertas activas</h2>
            <Link href="/panel/alerts" className="text-xs text-accent hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {pendingAlerts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin alertas pendientes</div>
            ) : (
              pendingAlerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3.5 flex items-start gap-3">
                  {alert.severity === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                    {alert.course_name && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.course_name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {[
{ href: '/panel/plans', label: 'Nuevo plan' },
            { href: '/panel/courses', label: 'Nuevo curso' },
            { href: '/panel/enrollments', label: 'Matricular estudiante' },
            { href: '/panel/reports', label: 'Ver informes' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary transition-colors"
            >
              {action.label}
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
