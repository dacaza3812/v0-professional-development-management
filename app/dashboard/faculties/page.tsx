'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Faculty { id: number; name: string; code: string; dean: string; email: string; phone: string; university_id: number; university_name: string; active: boolean }
interface Area { id: number; name: string; code: string; head: string; faculty_id: number; faculty_name: string; university_name: string; active: boolean }
interface University { id: number; name: string }

const emptyFaculty = (): Partial<Faculty> => ({ name: '', code: '', dean: '', email: '', phone: '', active: true })
const emptyArea = (): Partial<Area> => ({ name: '', code: '', head: '', active: true })

export default function FacultiesPage() {
  const { data: faculties = [], isLoading: loadingF, mutate: mutateFaculties } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const { data: areas = [], isLoading: loadingA, mutate: mutateAreas } = useSWR<Area[]>('/api/areas', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const [tab, setTab] = useState<'faculties' | 'areas'>('faculties')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Faculty | Area>>(emptyFaculty())
  const [editType, setEditType] = useState<'faculty' | 'area'>('faculty')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openCreate(type: 'faculty' | 'area') {
    setEditType(type); setEditing(type === 'faculty' ? emptyFaculty() : emptyArea()); setError(''); setModal(true)
  }
  function openEdit(row: Faculty | Area, type: 'faculty' | 'area') {
    setEditType(type); setEditing({ ...row }); setError(''); setModal(true)
  }

  async function handleDelete(row: Faculty | Area, type: 'faculty' | 'area') {
    if (!confirm(`¿Desactivar "${row.name}"?`)) return
    await fetch(`/api/${type === 'faculty' ? 'faculties' : 'areas'}/${row.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, active: false }),
    })
    type === 'faculty' ? mutateFaculties() : mutateAreas()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const url = editType === 'faculty'
      ? (editing.id ? `/api/faculties/${editing.id}` : '/api/faculties')
      : (editing.id ? `/api/areas/${editing.id}` : '/api/areas')
    try {
      const res = await fetch(url, {
        method: editing.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      editType === 'faculty' ? mutateFaculties() : mutateAreas()
      setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(['faculties', 'areas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>
            {t === 'faculties' ? 'Facultades' : 'Áreas'}
          </button>
        ))}
      </div>

      {tab === 'faculties' ? (
        <DataTable<Faculty>
          title="Facultades"
          description="Gestión de facultades por universidad"
          data={faculties}
          loading={loadingF}
          searchPlaceholder="Buscar facultad..."
          onAdd={() => openCreate('faculty')}
          onEdit={r => openEdit(r, 'faculty')}
          onDelete={r => handleDelete(r, 'faculty')}
          columns={[
            { key: 'code', label: 'Código', render: r => <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{r.code}</span> },
            { key: 'name', label: 'Nombre' },
            { key: 'university_name', label: 'Universidad' },
            { key: 'dean', label: 'Decano' },
            { key: 'active', label: 'Estado', render: r => <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>{r.active ? 'Activa' : 'Inactiva'}</span> },
          ]}
        />
      ) : (
        <DataTable<Area>
          title="Áreas"
          description="Gestión de áreas dentro de las facultades"
          data={areas}
          loading={loadingA}
          searchPlaceholder="Buscar área..."
          onAdd={() => openCreate('area')}
          onEdit={r => openEdit(r, 'area')}
          onDelete={r => handleDelete(r, 'area')}
          columns={[
            { key: 'code', label: 'Código', render: r => <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{r.code}</span> },
            { key: 'name', label: 'Nombre' },
            { key: 'faculty_name', label: 'Facultad' },
            { key: 'university_name', label: 'Universidad' },
            { key: 'head', label: 'Jefe de área' },
          ]}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={`${editing.id ? 'Editar' : 'Nueva'} ${editType === 'faculty' ? 'facultad' : 'área'}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {editType === 'faculty' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Universidad *</label>
                <select required value={(editing as Partial<Faculty>).university_id || ''} onChange={e => setEditing(p => ({ ...p, university_id: Number(e.target.value) }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar...</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código *</label>
                  <input required value={editing.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Decano</label>
                  <input value={(editing as Partial<Faculty>).dean || ''} onChange={e => setEditing(p => ({ ...p, dean: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Correo</label>
                  <input type="email" value={(editing as Partial<Faculty>).email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Facultad *</label>
                <select required value={(editing as Partial<Area>).faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: Number(e.target.value) }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar...</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.university_name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código *</label>
                  <input required value={editing.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Jefe de área</label>
                  <input value={(editing as Partial<Area>).head || ''} onChange={e => setEditing(p => ({ ...p, head: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </>
          )}
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
