'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Search, FileText, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Course { id: number; name: string; university_name: string; status: string; type: string }

export default function DocumentsPage() {
  const { data: courses = [], isLoading } = useSWR<Course[]>('/api/courses', fetcher)
  const [search, setSearch] = useState('')

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.university_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-normal">Documentación Docente</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Control de la documentación que los profesores deben entregar por curso
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar curso..."
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm">
        <p className="font-medium mb-1">Documentos requeridos por curso</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-muted-foreground text-xs">
          {['Programa del curso', 'Plan de clases', 'Acta de evaluación', 'Informe final', 'Materiales docentes', 'Otros documentos'].map(d => (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-accent" />{d}
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={`/panel/courses/${course.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-accent/30 hover:bg-secondary/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-0.5 truncate">{course.name}</div>
                <div className="text-xs text-muted-foreground">{course.university_name} • {course.type === 'plan' ? 'Plan' : 'Extraplan'}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No se encontraron cursos</div>
          )}
        </div>
      )}
    </div>
  )
}
