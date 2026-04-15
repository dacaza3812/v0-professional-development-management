'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Modal from './Modal'
import { ArrowLeft, Plus, Printer, Award } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Teacher { id: number; name: string; category: string; scientific_degree: string; course_role: string }
interface Enrollment {
  id: number; student_id: number; student_name: string; ci: string; student_email: string;
  workplace: string; position: string; status: string; grade: number | null; evaluation_date: string | null; grade_id: number | null
}
interface Document { id: number; type: string; name: string; status: string; submitted_date: string | null; teacher_name: string | null }
interface Course {
  id: number; name: string; code: string; type: string; modality: string; status: string;
  hours: number; credits: number; start_date: string; end_date: string;
  university_name: string; faculty_name: string; plan_name: string; enrolled_count: number; min_enrollment: number
}

const statusColors: Record<string, string> = {
  enrolled: 'bg-blue-50 text-blue-700', approved: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700', withdrawn: 'bg-secondary text-muted-foreground'
}
const statusLabels: Record<string, string> = { enrolled: 'Matriculado', approved: 'Aprobado', failed: 'Reprobado', withdrawn: 'Baja' }

export default function CourseDetail({ course, teachers, enrollments: initialEnrollments, documents: initialDocuments }: {
  course: Course; teachers: Teacher[]; enrollments: Enrollment[]; documents: Document[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'students' | 'documents' | 'teachers'>('students')
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [gradeModal, setGradeModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [grade, setGrade] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [studentModal, setStudentModal] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [docModal, setDocModal] = useState(false)
  const [docForm, setDocForm] = useState({ type: 'programa', name: '', description: '', submitted_date: '' })
  const { data: students = [] } = useSWR(studentSearch.length > 2 ? `/api/students?search=${studentSearch}` : null, fetcher)
  const { data: allTeachers = [] } = useSWR('/api/teachers', fetcher)

  async function addStudent(studentId: number) {
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: course.id, student_id: studentId })
    })
    if (res.ok) {
      const updated = await fetch(`/api/enrollments?course_id=${course.id}`).then(r => r.json())
      setEnrollments(updated)
      setStudentModal(false); setStudentSearch('')
    }
  }

  async function saveGrade() {
    if (!selectedEnrollment) return
    await fetch('/api/grades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: selectedEnrollment.id, grade: Number(grade), evaluation_type: 'final', evaluation_date: evalDate })
    })
    const updated = await fetch(`/api/enrollments?course_id=${course.id}`).then(r => r.json())
    setEnrollments(updated); setGradeModal(false)
  }

  async function issueCertificate(enrollment: Enrollment) {
    if (!enrollment.grade || enrollment.status !== 'approved') { alert('El estudiante debe tener nota aprobatoria'); return }
    if (!confirm(`¿Emitir certificado para ${enrollment.student_name}?`)) return
    await fetch('/api/certificates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollment.id, student_id: enrollment.student_id, course_id: course.id, grade: enrollment.grade })
    })
    alert('Certificado emitido correctamente')
  }

  async function saveDoc(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...docForm, course_id: course.id })
    })
    router.refresh(); setDocModal(false)
  }

  function printEnrollmentList() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Listado de Matrícula - ${course.name}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px}th{background:#f0f0f0}
      .header{margin-bottom:20px}.info{font-size:12px;color:#555}</style></head>
      <body>
        <div class="header">
          <h1>Listado de Matrícula</h1>
          <p class="info"><strong>Curso:</strong> ${course.name}</p>
          <p class="info"><strong>Universidad:</strong> ${course.university_name} | <strong>Facultad:</strong> ${course.faculty_name || '—'}</p>
          <p class="info"><strong>Fecha de impresión:</strong> ${new Date().toLocaleDateString('es-CU')}</p>
        </div>
        <table>
          <thead><tr><th>#</th><th>Nombre</th><th>CI</th><th>Correo</th><th>Centro de trabajo</th><th>Cargo</th><th>Estado</th><th>Nota</th><th>Firma</th></tr></thead>
          <tbody>${enrollments.map((e, i) => `
            <tr><td>${i + 1}</td><td>${e.student_name}</td><td>${e.ci || '—'}</td><td>${e.student_email || '—'}</td>
            <td>${e.workplace || '—'}</td><td>${e.position || '—'}</td>
            <td>${statusLabels[e.status]}</td><td>${e.grade ?? '—'}</td><td></td></tr>
          `).join('')}</tbody>
        </table>
        <p style="margin-top:40px;font-size:11px">Total matriculados: ${enrollments.length}</p>
      </body></html>
    `)
    win.document.close(); win.print()
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/panel/courses" className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-normal">{course.name}</h1>
          <p className="text-sm text-muted-foreground">{course.university_name} {course.faculty_name ? `• ${course.faculty_name}` : ''} {course.plan_name ? `• ${course.plan_name}` : ''}</p>
        </div>
      </div>

      {/* Course info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tipo', value: course.type === 'plan' ? 'Plan' : 'Extraplan' },
          { label: 'Modalidad', value: course.modality },
          { label: 'Horas', value: course.hours ? `${course.hours}h` : '—' },
          { label: 'Créditos', value: course.credits || '—' },
          { label: 'Inicio', value: course.start_date ? new Date(course.start_date).toLocaleDateString('es-CU') : '—' },
          { label: 'Fin', value: course.end_date ? new Date(course.end_date).toLocaleDateString('es-CU') : '—' },
          { label: 'Matriculados', value: `${enrollments.length} / ${course.min_enrollment} mín.` },
          { label: 'Estado', value: course.status },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-lg border border-border bg-card">
            <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
            <div className="text-sm font-medium capitalize">{String(item.value)}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-0">
        {(['students', 'teachers', 'documents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'students' ? `Estudiantes (${enrollments.length})` : t === 'teachers' ? `Profesores (${teachers.length})` : `Documentos`}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Lista de matriculados</h2>
            <div className="flex gap-2">
              <button onClick={printEnrollmentList} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-secondary transition-colors">
                <Printer className="w-3.5 h-3.5" /> Imprimir listado
              </button>
              <button onClick={() => setStudentModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Matricular
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">CI</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Centro</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Nota</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {enrollments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay estudiantes matriculados</td></tr>
                ) : enrollments.map((e, i) => (
                  <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{e.student_name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.ci || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{e.workplace || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[e.status]}`}>{statusLabels[e.status]}</span></td>
                    <td className="px-4 py-3 font-medium">{e.grade ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedEnrollment(e); setGrade(String(e.grade || '')); setEvalDate(e.evaluation_date?.slice(0, 10) || ''); setGradeModal(true) }}
                          className="text-xs px-2 py-1 border border-border rounded hover:bg-secondary transition-colors">Nota</button>
                        <button onClick={() => issueCertificate(e)} className="p-1 text-muted-foreground hover:text-accent transition-colors">
                          <Award className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'teachers' && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Categoría</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Grado científico</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Rol</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {teachers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No hay profesores asignados</td></tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.scientific_degree || '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border capitalize">{t.course_role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setDocModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar documento
            </button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Profesor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Fecha entrega</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {initialDocuments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay documentos registrados</td></tr>
                ) : initialDocuments.map(d => (
                  <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 capitalize">{d.type}</td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.teacher_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.submitted_date ? new Date(d.submitted_date).toLocaleDateString('es-CU') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'submitted' || d.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                        {d.status === 'pending' ? 'Pendiente' : d.status === 'submitted' ? 'Entregado' : d.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      <Modal open={gradeModal} onClose={() => setGradeModal(false)} title={`Registrar nota — ${selectedEnrollment?.student_name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nota (0-100)</label>
            <input type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de evaluación</label>
            <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setGradeModal(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">Cancelar</button>
            <button onClick={saveGrade} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Enroll student modal */}
      <Modal open={studentModal} onClose={() => { setStudentModal(false); setStudentSearch('') }} title="Matricular estudiante" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buscar estudiante (nombre o CI)</label>
            <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Escriba al menos 3 caracteres..."
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {students.map((s: { id: number; name: string; ci: string; workplace: string }) => (
              <button key={s.id} onClick={() => addStudent(s.id)}
                className="w-full text-left p-2.5 rounded-md hover:bg-secondary transition-colors text-sm">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.ci || '—'} • {s.workplace || '—'}</div>
              </button>
            ))}
            {studentSearch.length > 2 && students.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No se encontraron estudiantes</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Document modal */}
      <Modal open={docModal} onClose={() => setDocModal(false)} title="Agregar documento" size="sm">
        <form onSubmit={saveDoc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de documento</label>
            <select value={docForm.type} onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="programa">Programa</option>
              <option value="plan_clases">Plan de clases</option>
              <option value="acta">Acta de evaluación</option>
              <option value="informe">Informe final</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del documento *</label>
            <input required value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de entrega</label>
            <input type="date" value={docForm.submitted_date} onChange={e => setDocForm(p => ({ ...p, submitted_date: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setDocModal(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
