'use client'

import { useState } from 'react'
import useSWR from 'swr'
import DataTable from '@/components/dashboard/DataTable'
import Modal from '@/components/dashboard/Modal'
import { Eye, EyeOff, Shield } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface User {
  id: number; name: string; email: string; role: string;
  active: boolean; last_login: string | null; created_at: string;
  university_id: number | null; faculty_id: number | null;
  university_name: string | null; faculty_name: string | null
}
interface University { id: number; name: string }
interface Faculty { id: number; name: string; university_id: number }

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin', admin: 'Administrador', coordinator: 'Coordinador',
  professor: 'Profesor', viewer: 'Observador'
}
const roleColors: Record<string, string> = {
  superadmin: 'bg-red-50 text-red-700', admin: 'bg-purple-50 text-purple-700',
  coordinator: 'bg-blue-50 text-blue-700', professor: 'bg-green-50 text-green-700',
  viewer: 'bg-secondary text-muted-foreground'
}

const emptyUser = (): Partial<User> & { password?: string } => ({
  name: '', email: '', role: 'viewer', active: true
})

export default function UsersPage() {
  const { data: users = [], isLoading, mutate } = useSWR<User[]>('/api/users', fetcher)
  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const { data: faculties = [] } = useSWR<Faculty[]>('/api/faculties', fetcher)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<User> & { password?: string }>(emptyUser())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const filteredFaculties = editing.university_id
    ? faculties.filter(f => f.university_id === editing.university_id)
    : faculties

  function openCreate() { setEditing(emptyUser()); setError(''); setShowPass(false); setModal(true) }
  function openEdit(u: User) { setEditing({ ...u, password: '' }); setError(''); setShowPass(false); setModal(true) }

  async function handleToggleActive(u: User) {
    if (!confirm(`¿${u.active ? 'Desactivar' : 'Activar'} al usuario "${u.name}"?`)) return
    await fetch(`/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...u, active: !u.active }),
    })
    mutate()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/users/${editing.id}` : '/api/users'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing)
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return }
      mutate(); setModal(false)
    } catch { setError('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <>
      <DataTable<User>
        title="Usuarios del Sistema"
        description="Gestión de cuentas y roles de acceso"
        data={users}
        loading={isLoading}
        searchPlaceholder="Buscar usuario..."
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleToggleActive}
        columns={[
          { key: 'name', label: 'Nombre', render: r => (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium flex-shrink-0">
                {r.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{r.name}</span>
            </div>
          )},
          { key: 'email', label: 'Correo', render: r => <span className="text-muted-foreground">{r.email}</span> },
          { key: 'role', label: 'Rol', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${roleColors[r.role]}`}>
              <Shield className="w-3 h-3" />
              {roleLabels[r.role] || r.role}
            </span>
          )},
          { key: 'university_name', label: 'Universidad', render: r => <span className="text-muted-foreground">{r.university_name || '—'}</span> },
          { key: 'last_login', label: 'Último acceso', render: r => (
            <span className="text-muted-foreground text-xs">
              {r.last_login ? new Date(r.last_login).toLocaleDateString('es-CU') : 'Nunca'}
            </span>
          )},
          { key: 'active', label: 'Estado', render: r => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
              {r.active ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Editar usuario' : 'Nuevo usuario'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre completo *</label>
              <input required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correo electrónico *</label>
              <input required type="email" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol *</label>
              <select required value={editing.role || 'viewer'} onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="viewer">Observador</option>
                <option value="professor">Profesor</option>
                <option value="coordinator">Coordinador</option>
                <option value="admin">Administrador</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{editing.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required={!editing.id}
                  value={editing.password || ''}
                  onChange={e => setEditing(p => ({ ...p, password: e.target.value }))}
                  className="w-full h-9 pl-3 pr-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
