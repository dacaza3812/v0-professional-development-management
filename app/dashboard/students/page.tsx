'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Student {
  id: number; name: string; ci: string; email: string; phone: string;
  workplace: string; position: string; academic_degree: string;
  university_id: number | null; faculty_id: number | null; active: boolean
}
interface University { id: number; name: string }
interface Faculty { id: number; name: string; university_id: number }

const degreeLabels: Record<string, string> = {
  tecnico: 'Técnico', licenciado: 'Licenciado', ingeniero: 'Ingeniero',
  master: 'Máster', doctor: 'Doctor',
}

const empty = (): Partial<Student> => ({
  name: '', ci: '', email: '', phone: '', workplace: '', position: '', academic_degree: '', active: true
})

export default function StudentsPage() {
  const { data: students = [], isLoading, mutate } = useSWR<Student[]>('/api/students', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const { data: faculties = [] } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Student>>(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredFaculties = editing.university_id
    ? faculties.filter(f => f.university_id === editing.university_id)
    : faculties

  function openCreate() { setEditing(empty()); setError(''); setModal(true) }
  function openEdit(s: Student) { setEditing({ ...s }); setError(''); setModal(true) }

  async function handleDelete(s: Student) {
    if (!confirm(`¿Desactivar al estudiante "${s.name}"?`)) return
    await fetch(`/api/students/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, active: false }),
    })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/students/${editing.id}` : '/api/students'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<Student>
        title="Estudiantes"
        description="Registro de participantes en los cursos de posgrado"
        data={students}
        loading={isLoading}
        searchPlaceholder="Buscar estudiante..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'ci', label: 'C.I.', render: r => <span className="font-mono text-xs text-muted-foreground">{r.ci || '—'}</span> },
          { key: 'academic_degree', label: 'Nivel académico', render: r => <span className="text-muted-foreground">{degreeLabels[r.academic_degree] || r.academic_degree || '—'}</span> },
          { key: 'workplace', label: 'Centro de trabajo', render: r => <span className="text-muted-foreground">{r.workplace || '—'}</span> },
          { key: 'position', label: 'Cargo', render: r => <span className="text-muted-foreground">{r.position || '—'}</span> },
          { key: 'email', label: 'Correo', render: r => <span className="text-muted-foreground">{r.email || '—'}</span> },
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar estudiante' : 'Nuevo estudiante'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre completo *</label>
              <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carnet de identidad</label>
              <input value={editing.ci || ''} onChange={e => setEditing(p => ({ ...p, ci: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correo electrónico</label>
              <input type="email" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nivel académico</label>
              <select value={editing.academic_degree || ''} onChange={e => setEditing(p => ({ ...p, academic_degree: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin especificar</option>
                <option value="tecnico">Técnico</option>
                <option value="licenciado">Licenciado</option>
                <option value="ingeniero">Ingeniero</option>
                <option value="master">Máster</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Centro de trabajo</label>
              <input value={editing.workplace || ''} onChange={e => setEditing(p => ({ ...p, workplace: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cargo / Posición</label>
              <input value={editing.position || ''} onChange={e => setEditing(p => ({ ...p, position: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Universidad</label>
              <select value={editing.university_id || ''} onChange={e => setEditing(p => ({ ...p, university_id: e.target.value ? Number(e.target.value) : undefined, faculty_id: undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin universidad</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {filteredFaculties.length > 0 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Facultad</label>
                <select value={editing.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Sin facultad</option>
                  {filteredFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
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
