'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Teacher {
  id: number; name: string; ci: string; email: string; phone: string; category: string;
  scientific_degree: string; teaching_category: string; specialty: string;
  university_id: number | null; faculty_id: number | null; university_name: string; active: boolean
}
interface University { id: number; name: string }
interface Faculty { id: number; name: string; university_id: number }

const empty = (): Partial<Teacher> => ({ name: '', ci: '', email: '', phone: '', active: true })

export default function TeachersPage() {
  const { data: teachers = [], isLoading, mutate } = useSWR<Teacher[]>('/api/teachers', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const { data: faculties = [] } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Teacher>>(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredFaculties = editing.university_id ? faculties.filter(f => f.university_id === editing.university_id) : faculties

  function openCreate() { setEditing(empty()); setError(''); setModal(true) }
  function openEdit(t: Teacher) { setEditing({ ...t }); setError(''); setModal(true) }

  async function handleDelete(t: Teacher) {
    if (!confirm(`¿Desactivar al profesor "${t.name}"?`)) return
    await fetch(`/api/teachers/${t.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, active: false })
    })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/teachers/${editing.id}` : '/api/teachers'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<Teacher>
        title="Profesores"
        description="Gestión del claustro docente para los cursos de posgrado"
        data={teachers}
        loading={isLoading}
        searchPlaceholder="Buscar profesor..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'scientific_degree', label: 'Grado científico', render: r => <span className="text-muted-foreground">{r.scientific_degree || '—'}</span> },
          { key: 'teaching_category', label: 'Categoría docente', render: r => <span className="text-muted-foreground">{r.teaching_category || '—'}</span> },
          { key: 'specialty', label: 'Especialidad', render: r => <span className="text-muted-foreground">{r.specialty || '—'}</span> },
          { key: 'university_name', label: 'Universidad', render: r => <span className="text-muted-foreground">{r.university_name || '—'}</span> },
          { key: 'email', label: 'Correo', render: r => <span className="text-muted-foreground">{r.email || '—'}</span> },
          { key: 'active', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
              {r.active ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar profesor' : 'Nuevo profesor'} size="lg">
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
              <label className="block text-sm font-medium mb-1">Categoría científica</label>
              <select value={editing.scientific_degree || ''} onChange={e => setEditing(p => ({ ...p, scientific_degree: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin grado</option>
                <option value="Lic.">Licenciado(a)</option>
                <option value="Ing.">Ingeniero(a)</option>
                <option value="MSc.">Máster en Ciencias</option>
                <option value="DrC.">Doctor en Ciencias</option>
                <option value="Dr.">Doctor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría docente</label>
              <select value={editing.teaching_category || ''} onChange={e => setEditing(p => ({ ...p, teaching_category: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin categoría</option>
                <option value="Instructor">Instructor</option>
                <option value="Asistente">Asistente</option>
                <option value="Auxiliar">Profesor Auxiliar</option>
                <option value="Titular">Profesor Titular</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Especialidad</label>
              <input value={editing.specialty || ''} onChange={e => setEditing(p => ({ ...p, specialty: e.target.value }))}
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
            <div>
              <label className="block text-sm font-medium mb-1">Facultad</label>
              <select value={editing.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sin facultad</option>
                {filteredFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
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
