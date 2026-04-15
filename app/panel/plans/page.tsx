'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'
import { ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Plan {
  id: number; name: string; code: string; year: number; status: string; total_courses: number;
  courses_count: number; university_id: number; faculty_id: number | null; area_id: number | null;
  university_name: string; faculty_name: string | null; area_name: string | null;
  start_date: string | null; end_date: string | null; description: string | null
}
interface University { id: number; name: string }
interface Faculty { id: number; name: string; university_id: number }
interface Area { id: number; name: string; faculty_id: number }

const statusLabels: Record<string, string> = { draft: 'Borrador', active: 'Activo', completed: 'Completado', cancelled: 'Cancelado' }
const statusColors: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground', active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700', cancelled: 'bg-red-50 text-red-700',
}

const emptyPlan = (): Partial<Plan> => ({ name: '', code: '', year: new Date().getFullYear(), status: 'draft', total_courses: 0 })

export default function PlansPage() {
  const { data: plans = [], isLoading, mutate } = useSWR<Plan[]>('/api/plans', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const { data: faculties = [] } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const { data: areas = [] } = useSWR<Area[]>('/api/areas', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Plan>>(emptyPlan())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredFaculties = editing.university_id ? faculties.filter(f => f.university_id === editing.university_id) : faculties
  const filteredAreas = editing.faculty_id ? areas.filter(a => a.faculty_id === editing.faculty_id) : areas

  function openCreate() { setEditing(emptyPlan()); setError(''); setModal(true) }
  function openEdit(p: Plan) { setEditing({ ...p }); setError(''); setModal(true) }

  async function handleDelete(p: Plan) {
    if (!confirm(`¿Eliminar el plan "${p.name}"?`)) return
    await fetch(`/api/plans/${p.id}`, { method: 'DELETE' })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/plans/${editing.id}` : '/api/plans'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<Plan>
        title="Planes de Posgrado"
        description="Gestión de planes anuales de superación profesional"
        data={plans}
        loading={isLoading}
        searchPlaceholder="Buscar plan..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'code', label: 'Código', render: r => <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{r.code}</span> },
          { key: 'name', label: 'Nombre', render: r => (
            <Link href={`/panel/plans/${r.id}`} className="font-medium hover:text-accent transition-colors flex items-center gap-1">
              {r.name} <ChevronRight className="w-3 h-3" />
            </Link>
          )},
          { key: 'year', label: 'Año' },
          { key: 'university_name', label: 'Universidad' },
          { key: 'courses_count', label: 'Cursos', render: r => (
            <span className="text-sm">{r.courses_count} / {r.total_courses}</span>
          )},
          { key: 'status', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar plan' : 'Nuevo plan de posgrado'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre del plan *</label>
              <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input required value={editing.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Año *</label>
              <input type="number" required min="2020" max="2040" value={editing.year || ''} onChange={e => setEditing(p => ({ ...p, year: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Universidad *</label>
              <select required value={editing.university_id || ''} onChange={e => setEditing(p => ({ ...p, university_id: Number(e.target.value), faculty_id: undefined, area_id: undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seleccionar...</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facultad</label>
              <select value={editing.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value ? Number(e.target.value) : undefined, area_id: undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Todas las facultades</option>
                {filteredFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Área</label>
              <select value={editing.area_id || ''} onChange={e => setEditing(p => ({ ...p, area_id: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin área específica</option>
                {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
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
              <label className="block text-sm font-medium mb-1">Total de cursos planificados</label>
              <input type="number" min="0" value={editing.total_courses || 0} onChange={e => setEditing(p => ({ ...p, total_courses: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={editing.status || 'draft'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea rows={3} value={editing.description || ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
