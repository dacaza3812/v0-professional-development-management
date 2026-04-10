'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, Printer, Award } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Certificate {
  id: number; certificate_number: string; student_name: string; ci: string;
  course_name: string; university_name: string; grade: number; issued_date: string
}

export default function CertificatesPage() {
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const { data: courses = [] } = useSWR('/api/courses', fetcher)
  const { data: certificates = [], isLoading } = useSWR<Certificate[]>(
    selectedCourseId ? `/api/certificates?course_id=${selectedCourseId}` : null, fetcher
  )

  const filteredCourses = courses.filter((c: { name: string }) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase())
  )

  function printCertificate(cert: Certificate) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Certificado ${cert.certificate_number}</title>
      <style>
        body{font-family:'Times New Roman',serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff}
        .cert{width:700px;border:8px double #1a1a2e;padding:50px;text-align:center;position:relative}
        .cert::before{content:'';position:absolute;inset:8px;border:2px solid #1a1a2e}
        h1{font-size:32px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase}
        .sub{font-size:14px;color:#555;margin-bottom:30px;text-transform:uppercase;letter-spacing:3px}
        .certify{font-size:14px;color:#555;margin-bottom:12px}
        .name{font-size:26px;font-style:italic;border-bottom:2px solid #1a1a2e;display:inline-block;padding:0 20px 5px;margin:10px 0 20px}
        .course{font-size:16px;margin-bottom:8px}
        .details{font-size:13px;color:#555;margin-bottom:30px}
        .grade{font-size:20px;font-weight:bold;margin-bottom:30px}
        .footer{display:flex;justify-content:space-between;margin-top:40px;font-size:12px;color:#555}
        .sig{text-align:center;border-top:1px solid #333;padding-top:6px;width:200px}
        .cert-num{font-size:11px;color:#999;margin-top:20px}
      </style></head>
      <body><div class="cert">
        <h1>Certificado</h1>
        <p class="sub">Superación Profesional</p>
        <p class="certify">Se certifica que</p>
        <div class="name">${cert.student_name}</div>
        <p class="certify">ha completado satisfactoriamente el curso</p>
        <p class="course"><strong>${cert.course_name}</strong></p>
        <p class="details">${cert.university_name}</p>
        <p class="grade">Calificación final: <strong>${cert.grade}</strong> puntos</p>
        <p class="details">Emitido el ${new Date(cert.issued_date).toLocaleDateString('es-CU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div class="footer">
          <div class="sig">Secretaría General</div>
          <div class="sig">Rector</div>
        </div>
        <p class="cert-num">N° ${cert.certificate_number}</p>
      </div></body></html>
    `)
    win.document.close(); win.print()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-normal">Certificados</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Consulte e imprima los certificados emitidos</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Seleccionar curso</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)} placeholder="Buscar curso..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {filteredCourses.map((c: { id: number; name: string; university_name: string }) => (
              <button key={c.id} onClick={() => setSelectedCourseId(c.id)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${selectedCourseId === c.id ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}>
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.university_name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {!selectedCourseId ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <Award className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Seleccione un curso para ver los certificados</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">{certificates.length} certificados emitidos</span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Estudiante</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Nota</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">Imprimir</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {certificates.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay certificados emitidos para este curso</td></tr>
                  ) : certificates.map(cert => (
                    <tr key={cert.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cert.certificate_number}</td>
                      <td className="px-4 py-3 font-medium">{cert.student_name}</td>
                      <td className="px-4 py-3 font-semibold">{cert.grade}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(cert.issued_date).toLocaleDateString('es-CU')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => printCertificate(cert)} className="p-1.5 text-muted-foreground hover:text-accent transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
