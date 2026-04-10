'use client'

import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface Props<T extends { id: number }> {
  title: string
  description?: string
  columns: Column<T>[]
  data: T[]
  onAdd?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  loading?: boolean
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}

const PAGE_SIZE = 15

export default function DataTable<T extends { id: number }>({
  title, description, columns, data, onAdd, onEdit, onDelete,
  searchPlaceholder = 'Buscar...', searchKeys = [], loading,
  canCreate = true, canUpdate = true, canDelete = true
}: Props<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = searchKeys.length > 0
    ? data.filter(row =>
        searchKeys.some(key => {
          const val = row[key]
          return val && String(val).toLowerCase().includes(search.toLowerCase())
        })
      )
    : data.filter(row =>
        Object.values(row as Record<string, unknown>).some(val =>
          val && String(val).toLowerCase().includes(search.toLowerCase())
        )
      )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-normal">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {onAdd && canCreate && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder={searchPlaceholder}
          className="w-full max-w-sm h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">Cargando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">No hay registros</td></tr>
              ) : (
                paginated.map(row => (
                  <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && canUpdate && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && canDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} registros</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
