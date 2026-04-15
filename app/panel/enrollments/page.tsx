'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Search, ChevronRight, Users } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Course {
  id: number; name: string; type: string; status: string; start_date: string | null;
  university_name: string; faculty_name: string | null; enrolled_count: number; min_enrollment: number; teachers: string | null
}

const statusColors: Record<string, string> = {
  planned: 'bg-secondary text-muted-foreground', open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700'
}
const statusLabels: Record<string, string> = {
  planned: 'Planificado', open: 'Abierto', in_progress: 'En curso', completed: 'Finalizado', cancelled: 'Cancelado'
}

export default function EnrollmentsPage() {
  const { data: courses = [], isLoading } = useSWR<Course[]>('/api/courses', fetcher)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = courses.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.university_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-normal">Matrículas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Seleccione un curso para gestionar sus matrículas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar curso..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">Todos los estados</option>
          <option value="planned">Planificado</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Finalizado</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando cursos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No se encontraron cursos</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(course => {
            const enrolledNum = Number(course.enrolled_count)
            const isLow = enrolledNum < course.min_enrollment && course.status !== 'completed'
            return (
              <Link
                key={course.id}
                href={`/panel/courses/${course.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-accent/30 hover:bg-secondary/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-medium text-sm">{course.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[course.status]}`}>{statusLabels[course.status]}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground">{course.type === 'plan' ? 'Plan' : 'Extraplan'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {course.university_name} {course.faculty_name ? `• ${course.faculty_name}` : ''} •{' '}
                    {course.teachers || 'Sin profesor'} •{' '}
                    {course.start_date ? new Date(course.start_date).toLocaleDateString('es-CU') : 'Sin fecha'}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${isLow ? 'text-amber-600' : ''}`}>{enrolledNum}</div>
                    <div className="text-xs text-muted-foreground">de {course.min_enrollment} mín.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
