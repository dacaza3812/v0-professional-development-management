import Link from 'next/link'
import { GraduationCap, BookOpen, Users, BarChart3, Bell, Shield, ChevronRight, Award, ClipboardList, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center" style={{ color: '#3adf0b' }}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">SGPosgrado</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#modules" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#about" className="hover:text-foreground transition-colors">Acerca de</a>
          </nav>
          <Link
            href="/login"
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground mb-8 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            Universidad de Las Tunas — Secretaría General
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-normal leading-[1.1] text-balance mb-6 tracking-tight">
            Gestión de la
            <br />
            <em className="not-italic text-accent">Superación Profesional</em>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 text-balance">
            Plataforma integral para la administración de planes de posgrado, cursos, matrículas, resultados académicos e informes estadísticos universitarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Acceder al sistema
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors font-medium text-sm text-foreground"
            >
              Conocer más
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/30 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 'Multi-sede', label: 'Gestión por universidad' },
            { value: '5 roles', label: 'Control de permisos' },
            { value: 'Tiempo real', label: 'Alertas automáticas' },
            { value: 'Exportable', label: 'Informes y listados' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-2xl font-semibold text-foreground mb-1">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-balance mb-4">
              Todo lo que necesita, en un solo lugar
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Diseñado específicamente para las necesidades de la superación profesional universitaria en Cuba.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Planes de Posgrado',
                desc: 'Gestione planes anuales, asigne cursos plan y extraplan, y haga seguimiento del cumplimiento.'
              },
              {
                icon: Users,
                title: 'Matrícula y Estudiantes',
                desc: 'Registro de estudiantes, control de matrículas, listados oficiales y seguimiento por curso.'
              },
              {
                icon: ClipboardList,
                title: 'Resultados Académicos',
                desc: 'Registro de notas, evaluaciones finales y actualización automática del estado de aprobación.'
              },
              {
                icon: Award,
                title: 'Certificados',
                desc: 'Emisión de certificados numerados automáticamente para los estudiantes que aprueban.'
              },
              {
                icon: FileText,
                title: 'Documentación Docente',
                desc: 'Control de la documentación que el profesor debe entregar: programas, actas, informes.'
              },
              {
                icon: BarChart3,
                title: 'Informes Estadísticos',
                desc: 'Informes por universidad, facultad y área. Cumplimiento del plan, matrículas y resultados.'
              },
              {
                icon: Bell,
                title: 'Alertas Inteligentes',
                desc: 'Notificaciones automáticas cuando un curso debe comenzar o no tiene suficientes matriculados.'
              },
              {
                icon: Shield,
                title: 'Control de Acceso',
                desc: 'Sistema de permisos por roles: Superadmin, Admin, Coordinador, Profesor y Visualizador.'
              },
              {
                icon: GraduationCap,
                title: 'Multi-universidad',
                desc: 'Soporte para múltiples universidades, facultades y áreas en una sola plataforma.'
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-lg border border-border hover:border-accent/30 hover:bg-secondary/30 transition-all group">
                <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                  <f.icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules section */}
      <section id="modules" className="py-28 px-6 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-balance mb-4">
              Módulos del sistema
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              Cada sección del dashboard cubre un aspecto crítico de la gestión de posgrado.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-primary-foreground/10 rounded-lg overflow-hidden border border-primary-foreground/10">
            {[
              ['Universidades y Facultades', 'Gestión de la estructura organizativa completa con áreas y departamentos.'],
              ['Planes de Posgrado', 'Creación y seguimiento de planes anuales con control de cumplimiento.'],
              ['Cursos Plan y Extraplan', 'Administración de todos los cursos con fechas, modalidades y cupos.'],
              ['Profesores', 'Registro con categoría docente, grado científico y especialidad.'],
              ['Matrícula', 'Inscripción de estudiantes, listados oficiales y control de cupos mínimos.'],
              ['Resultados', 'Notas, evaluaciones y actualización automática del estado académico.'],
              ['Documentación', 'Control de entrega de documentos requeridos por los profesores.'],
              ['Certificados', 'Emisión y numeración automática de certificados para graduados.'],
              ['Informes', 'Estadísticas por período, universidad, facultad y tipo de curso.'],
              ['Alertas', 'Sistema automático de avisos sobre cursos próximos con bajo enrolamiento.'],
            ].map(([title, desc]) => (
              <div key={title} className="p-6 bg-primary hover:bg-primary-foreground/5 transition-colors">
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm mb-1">{title}</div>
                    <div className="text-xs text-primary-foreground/60 leading-relaxed">{desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-balance mb-6">
            Desarrollado para la excelencia académica
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mx-auto mb-10">
            El Sistema de Gestión de la Superación Profesional fue creado para satisfacer las necesidades específicas de la Secretaría General de la Universidad de Las Tunas, adaptable a cualquier universidad del país.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            Comenzar ahora
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center" style={{ color: '#3adf0b' }}>
              <GraduationCap className="w-3 h-3" />
            </div>
            <span className="font-medium text-foreground">SGPosgrado</span>
            <span>— Universidad de Las Tunas</span>
          </div>
          <div>© {new Date().getFullYear()} Secretaría General. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  )
}
