'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, BookOpen, Users, Award, ClipboardList } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface University { id: number; name: string }

interface ReportData {
  stats: {
    total_courses: string; plan_courses: string; extraplan_courses: string;
    total_enrollments: string; approved_count: string; failed_count: string; certificates_issued: string
  }
  byFaculty: { faculty_name: string; course_count: string; student_count: string }[]
  planCompliance: { plan_name: string; planned: number; actual_courses: string; status: string; compliance_pct: string }[]
  monthlyTrend: { month: string; month_num: number; enrollments: string }[]
  year: string
}

const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

export default function ReportsPage() {
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const { data: universities = [] } = useSWR<University[]>('/api/universities', fetcher)

  const params = new URLSearchParams({ year: selectedYear })
  if (selectedUniversity) params.set('university_id', selectedUniversity)

  const { data, isLoading } = useSWR<ReportData>(
    `/api/reports?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  )

  const stats = data?.stats

  const statCards = [
    { label: 'Total cursos', value: stats?.total_courses || '0', icon: BookOpen, sub: `${stats?.plan_courses || 0} plan · ${stats?.extraplan_courses || 0} extraplan` },
    { label: 'Matrículas', value: stats?.total_enrollments || '0', icon: Users, sub: `${stats?.approved_count || 0} aprobados` },
    { label: 'Reprobados', value: stats?.failed_count || '0', icon: TrendingUp, sub: 'evaluaciones finales' },
    { label: 'Certificados', value: stats?.certificates_issued || '0', icon: Award, sub: 'emitidos en el año' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-normal">Reportes y Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Indicadores de gestión del posgrado</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedUniversity}
            onChange={e => setSelectedUniversity(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las universidades</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <card.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="text-3xl font-light mb-1">
              {isLoading ? <span className="animate-pulse bg-secondary rounded w-12 h-7 inline-block" /> : card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Enrollment Trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Tendencia de matrículas mensual</h2>
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>
          ) : !data?.monthlyTrend?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos para este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Matrículas" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Courses by Faculty */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Cursos por facultad</h2>
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>
          ) : !data?.byFaculty?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos para este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byFaculty.slice(0, 8)} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="faculty_name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                />
                <Bar dataKey="course_count" name="Cursos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan Compliance */}
        <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Cumplimiento de planes de posgrado</h2>
          </div>
          {isLoading ? (
            <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>
          ) : !data?.planCompliance?.length ? (
            <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No hay planes para este período</div>
          ) : (
            <div className="space-y-3">
              {data.planCompliance.map((plan, i) => {
                const pct = parseFloat(plan.compliance_pct) || 0
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-48 text-sm truncate flex-shrink-0" title={plan.plan_name}>{plan.plan_name}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 90 ? 'hsl(142, 71%, 45%)' : pct >= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--destructive))'
                        }}
                      />
                    </div>
                    <div className="text-sm font-medium w-16 text-right flex-shrink-0">
                      {plan.actual_courses}/{plan.planned}
                    </div>
                    <div className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Approval Rate Donut */}
        {stats && (Number(stats.approved_count) + Number(stats.failed_count)) > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Tasa de aprobación</h2>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Aprobados', value: Number(stats.approved_count) },
                    { name: 'Reprobados', value: Number(stats.failed_count) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                >
                  <Cell fill="hsl(142, 71%, 45%)" />
                  <Cell fill="hsl(var(--destructive))" />
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
