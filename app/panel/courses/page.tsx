'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'
import { ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Course {
  id: number; name: string; code: string; type: string; modality: string; status: string;
  hours: number | null; credits: number | null; start_date: string | null; end_date: string | null;
  min_enrollment: number; max_enrollment: number | null; university_id: number;
  faculty_id: number | null; area_id: number | null; postgraduate_plan_id: number | null;
  university_name: string; faculty_name: string | null; plan_name: string | null;
  enrolled_count: number; teachers: string | null
}
interface University { id: number; name: string }
interface Faculty { id: number; name: string; university_id: number }
interface Plan { id: number; name: string; university_id: number }

const statusLabels: Record<string, string> = { planned: 'Planificado', open: 'Abierto', in_progress: 'En curso', completed: 'Finalizado', cancelled: 'Cancelado' }
const statusColors: Record<string, string> = {
  planned: 'bg-secondary text-muted-foreground', open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700'
}

const emptyCourse = (): Partial<Course> => ({
  name: '', code: '', type: 'plan', modality: 'presencial', status: 'planned', min_enrollment: 5, hours: undefined
})

export default function CoursesPage() {
  const { data: courses = [], isLoading, mutate } = useSWR<Course[]>('/api/courses', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const { data: faculties = [] } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const { data: plans = [] } = useSWR<Plan[]>('/api/plans', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Course>>(emptyCourse())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'plan' | 'extraplan'>('all')

  const filteredFaculties = editing.university_id ? faculties.filter(f => f.university_id === editing.university_id) : faculties
  const filteredPlans = editing.university_id ? plans.filter(p => p.university_id === editing.university_id) : plans
  const displayCourses = typeFilter === 'all' ? courses : courses.filter(c => c.type === typeFilter)

  function openCreate() { setEditing(emptyCourse()); setError(''); setModal(true) }
  function openEdit(c: Course) { setEditing({ ...c }); setError(''); setModal(true) }

  async function handleDelete(c: Course) {
    if (!confirm(`¿Cancelar el curso "${c.name}"?`)) return
    await fetch(`/api/courses/${c.id}`, { method: 'DELETE' })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/courses/${editing.id}` : '/api/courses'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(['all', 'plan', 'extraplan'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>
            {t === 'all' ? 'Todos' : t === 'plan' ? 'Plan' : 'Extraplan'}
          </button>
        ))}
      </div>

      <DataTable<Course>
        title="Cursos"
        description="Gestión de cursos plan y extraplan"
        data={displayCourses}
        loading={isLoading}
        searchPlaceholder="Buscar curso..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', label: 'Nombre', render: r => (
            <Link href={`/panel/courses/${r.id}`} className="font-medium hover:text-accent transition-colors flex items-center gap-1">
              {r.name} <ChevronRight className="w-3 h-3" />
            </Link>
          )},
          { key: 'type', label: 'Tipo', render: r => (
            <span className="text-xs px-1.5 py-0.5 rounded border border-border">{r.type === 'plan' ? 'Plan' : 'Extraplan'}</span>
          )},
          { key: 'university_name', label: 'Universidad' },
          { key: 'teachers', label: 'Profesor(es)', render: r => <span className="text-muted-foreground">{r.teachers || '—'}</span> },
          { key: 'start_date', label: 'Inicio', render: r => r.start_date ? new Date(r.start_date).toLocaleDateString('es-CU') : '—' },
          { key: 'enrolled_count', label: 'Matrícula', render: r => (
            <span className={Number(r.enrolled_count) < r.min_enrollment && r.status !== 'completed' ? 'text-amber-600 font-medium' : ''}>
              {r.enrolled_count}/{r.min_enrollment}
            </span>
          )},
          { key: 'status', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar curso' : 'Nuevo curso'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre del curso *</label>
              <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input value={editing.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select required value={editing.type || 'plan'} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="plan">Plan</option>
                <option value="extraplan">Extraplan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Universidad *</label>
              <select required value={editing.university_id || ''} onChange={e => setEditing(p => ({ ...p, university_id: Number(e.target.value), faculty_id: undefined, postgraduate_plan_id: undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seleccionar...</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facultad</label>
              <select value={editing.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin facultad específica</option>
                {filteredFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plan de posgrado</label>
              <select value={editing.postgraduate_plan_id || ''} onChange={e => setEditing(p => ({ ...p, postgraduate_plan_id: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin plan asociado</option>
                {filteredPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modalidad</label>
              <select value={editing.modality || 'presencial'} onChange={e => setEditing(p => ({ ...p, modality: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="presencial">Presencial</option>
                <option value="semipresencial">Semipresencial</option>
                <option value="a_distancia">A distancia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Horas</label>
              <input type="number" min="0" value={editing.hours || ''} onChange={e => setEditing(p => ({ ...p, hours: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Créditos</label>
              <input type="number" min="0" value={editing.credits || ''} onChange={e => setEditing(p => ({ ...p, credits: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inicio</label>
              <input type="date" value={editing.start_date?.slice(0, 10) || ''} onChange={e => setEditing(p => ({ ...p, start_date: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha fin</label>
              <input type="date" value={editing.end_date?.slice(0, 10) || ''} onChange={e => setEditing(p => ({ ...p, end_date: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matrícula mínima</label>
              <input type="number" min="1" value={editing.min_enrollment || 5} onChange={e => setEditing(p => ({ ...p, min_enrollment: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matrícula máxima</label>
              <input type="number" min="1" value={editing.max_enrollment || ''} onChange={e => setEditing(p => ({ ...p, max_enrollment: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={editing.status || 'planned'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="planned">Planificado</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En curso</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
