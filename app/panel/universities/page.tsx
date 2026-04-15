'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface University {
  id: number; name: string; code: string; rector: string;
  email: string; phone: string; website: string; address: string; active: boolean
}

const empty = (): Partial<University> => ({
  name: '', code: '', rector: '', email: '', phone: '', website: '', address: '', active: true
})

export default function UniversitiesPage() {
  const { data = [], isLoading, mutate } = useSWR<University[]>('/api/universities', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<University>>(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openCreate() { setEditing(empty()); setError(''); setModal(true) }
  function openEdit(u: University) { setEditing({ ...u }); setError(''); setModal(true) }

  async function handleDelete(u: University) {
    if (!confirm(`¿Desactivar la universidad "${u.name}"?`)) return
    await fetch(`/api/universities/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...u, active: false }),
    })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/universities/${editing.id}` : '/api/universities'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<University>
        title="Universidades"
        description="Gestión de universidades del sistema"
        data={data}
        loading={isLoading}
        searchPlaceholder="Buscar universidad..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'code', label: 'Código', render: r => <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{r.code}</span> },
          { key: 'name', label: 'Nombre' },
          { key: 'rector', label: 'Rector' },
          { key: 'email', label: 'Correo' },
          { key: 'active', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
              {r.active ? 'Activa' : 'Inactiva'}
            </span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar universidad' : 'Nueva universidad'}>
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
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Rector</label>
              <input value={editing.rector || ''} onChange={e => setEditing(p => ({ ...p, rector: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sitio web</label>
              <input value={editing.website || ''} onChange={e => setEditing(p => ({ ...p, website: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input value={editing.address || ''} onChange={e => setEditing(p => ({ ...p, address: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
