'use client'

import useSWR from 'swr'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Alert {
  id: number; type: string; message: string; severity: string; course_name: string | null;
  start_date: string | null; created_at: string; resolved: boolean
}
interface University { id: number; name: string }

const severityConfig: Record<string, { icon: React.ElementType; label: string; cls: string; iconCls: string }> = {
  danger: { icon: AlertCircle, label: 'Crítica', cls: 'bg-red-50 border-red-200', iconCls: 'text-red-500' },
  warning: { icon: AlertTriangle, label: 'Advertencia', cls: 'bg-amber-50 border-amber-200', iconCls: 'text-amber-500' },
  info: { icon: Info, label: 'Información', cls: 'bg-blue-50 border-blue-200', iconCls: 'text-blue-500' },
}

const typeLabels: Record<string, string> = {
  low_enrollment: 'Baja matrícula',
  deadline: 'Fecha límite',
  missing_document: 'Documentación faltante',
  missing_grade: 'Notas pendientes',
}

export default function AlertsPage() {
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [resolving, setResolving] = useState<number | null>(null)

  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)
  const params = new URLSearchParams()
  if (selectedUniversity) params.set('university_id', selectedUniversity)

  const { data: alerts = [], isLoading, mutate } = useSWR<Alert[]>(
    `/api/alerts?${params.toString()}`,
    fetcher,
    { refreshInterval: 60000 }
  )

  async function resolveAlert(id: number) {
    setResolving(id)
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      mutate()
    } finally {
      setResolving(null)
    }
  }

  const dangerAlerts = alerts.filter(a => a.severity === 'danger')
  const warningAlerts = alerts.filter(a => a.severity === 'warning')
  const infoAlerts = alerts.filter(a => a.severity === 'info')

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-normal">Alertas del Sistema</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Notificaciones automáticas sobre incidencias en cursos y matrículas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedUniversity}
            onChange={e => setSelectedUniversity(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las universidades</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-1.5 h-9 px-3 border border-border rounded-md text-sm hover:bg-secondary transition-colors text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Críticas', count: dangerAlerts.length, cls: 'border-red-200 bg-red-50', textCls: 'text-red-700' },
          { label: 'Advertencias', count: warningAlerts.length, cls: 'border-amber-200 bg-amber-50', textCls: 'text-amber-700' },
          { label: 'Información', count: infoAlerts.length, cls: 'border-blue-200 bg-blue-50', textCls: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
            <div className={`text-2xl font-light ${s.textCls}`}>{s.count}</div>
            <div className={`text-xs font-medium ${s.textCls}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando alertas...</div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
          <p className="font-medium">Sin alertas pendientes</p>
          <p className="text-sm text-muted-foreground mt-1">Todo está en orden en el sistema</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.info
            const Icon = config.icon
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-4 rounded-xl border ${config.cls}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconCls}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.cls} ${config.iconCls}`}>
                      {config.label}
                    </span>
                    {alert.type && (
                      <span className="text-xs text-muted-foreground">
                        {typeLabels[alert.type] || alert.type}
                      </span>
                    )}
                    {alert.course_name && (
                      <span className="text-xs font-medium truncate">{alert.course_name}</span>
                    )}
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.created_at).toLocaleDateString('es-CU', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  disabled={resolving === alert.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border bg-white/60 rounded-md hover:bg-white transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {resolving === alert.id ? 'Resolviendo...' : 'Resolver'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
