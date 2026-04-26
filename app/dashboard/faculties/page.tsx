'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Faculty {
  id: number; name: string; code: string; dean: string
  email: string; phone: string; university_id: number; university_name: string; active: boolean
}

const emptyFaculty = (): Partial<Faculty> => ({ name: '', code: '', dean: '', email: '', phone: '', active: true })

export default function FacultiesPage() {
  const { data: faculties = [], isLoading, mutate } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Faculty>>(emptyFaculty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openCreate() { setEditing(emptyFaculty()); setError(''); setModal(true) }
  function openEdit(row: Faculty) { setEditing({ ...row }); setError(''); setModal(true) }

  async function handleDelete(row: Faculty) {
    if (!confirm(`¿Desactivar la facultad "${row.name}"?`)) return
    await fetch(`/api/faculties/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, active: false }),
    })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const url = editing.id ? `/api/faculties/${editing.id}` : '/api/faculties'
    try {
      const res = await fetch(url, {
        method: editing.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<Faculty>
        title="Facultades"
        description="Gestión de facultades de la Universidad de Las Tunas"
        data={faculties}
        loading={isLoading}
        searchPlaceholder="Buscar facultad..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'code', label: 'Código', render: r => <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{r.code}</span> },
          { key: 'name', label: 'Nombre' },
          { key: 'dean', label: 'Decano' },
          { key: 'email', label: 'Correo' },
          { key: 'active', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
              {r.active ? 'Activa' : 'Inactiva'}
            </span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar facultad' : 'Nueva facultad'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input type="email" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Decano</label>
              <input value={editing.dean || ''} onChange={e => setEditing(p => ({ ...p, dean: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
