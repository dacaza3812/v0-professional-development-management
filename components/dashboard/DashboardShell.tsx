'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  GraduationCap, LayoutDashboard, Building2, BookOpen, Users, ClipboardList,
  BarChart3, Bell, LogOut, Menu, X, ChevronDown, Award, FileText,
  GalleryVerticalEnd, UserCog, ChevronRight
} from 'lucide-react'
import type { SessionUser } from '@/lib/auth'

interface Props {
  user: SessionUser
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/universities', label: 'Universidades', icon: Building2, roles: ['superadmin', 'admin'] },
  { href: '/dashboard/faculties', label: 'Facultades y Áreas', icon: GalleryVerticalEnd },
  { href: '/dashboard/plans', label: 'Planes de Posgrado', icon: BookOpen },
  { href: '/dashboard/courses', label: 'Cursos', icon: ClipboardList },
  { href: '/dashboard/teachers', label: 'Profesores', icon: UserCog },
  { href: '/dashboard/students', label: 'Estudiantes', icon: GraduationCap },
  { href: '/dashboard/enrollments', label: 'Matrículas', icon: Users },
  { href: '/dashboard/certificates', label: 'Certificados', icon: Award },
  { href: '/dashboard/documents', label: 'Documentación', icon: FileText },
  { href: '/dashboard/reports', label: 'Informes', icon: BarChart3 },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['superadmin', 'admin'] },
]

const roleLabels: Record<string, string> = {
  superadmin: 'Superadministrador',
  admin: 'Administrador',
  coordinator: 'Coordinador',
  professor: 'Profesor',
  viewer: 'Visualizador',
}

export default function DashboardShell({ user, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleNav = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user.role)
  })

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center flex-shrink-0" style={{ color: '#3adf0b' }}>
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sidebar-foreground font-semibold text-sm truncate">SGPosgrado</div>
          <div className="text-sidebar-foreground/40 text-xs truncate">Sec. General ULT</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.href === '/dashboard/alerts' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-1">
          <div className="text-sidebar-foreground text-sm font-medium truncate">{user.name}</div>
          <div className="text-sidebar-foreground/40 text-xs">{roleLabels[user.role] || user.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-sidebar z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed top header */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 border-b border-border flex items-center px-4 gap-4 flex-shrink-0 bg-background z-30">
          <div className="max-w-6xl mx-auto w-full flex items-center">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center" style={{ color: '#3adf0b' }}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-serif text-lg font-semibold ml-3 hidden sm:inline">SGPosgrado</span>
            <div className="flex-1" />
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground min-w-0">
              <span className="font-medium text-foreground">Dashboard</span>
              {pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {visibleNav.find(n => isActive(n.href, n.exact))?.label || ''}
                  </span>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Link href="/dashboard/alerts" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-muted-foreground">{user.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}
