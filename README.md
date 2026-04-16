# SGPosgrado - Sistema de Gestión de Superación Profesional

Sistema web para la gestión integral de posgrados universitarios. Permite administrar universidades, facultades, planes de posgrado, cursos, matrículas, estudiantes, profesores, certificados y generación de reportes estadísticos.

## Características

- **Gestión de Universidades y Facultades**: Administración de estructura organizativa
- **Planes de Posgrado**: Control de planes anuales de superación profesional
- **Cursos**: Gestión de cursos plan y extraplan con diferentes modalidades (presencial, semipresencial, a distancia)
- **Matrículas**: Registro y seguimiento de estudiantes matriculados
- **Profesores**: Administración de docentes y asignación a cursos
- **Estudiantes**: Gestión de información de estudiantes
- **Certificados**: Emisión de certificados por curso aprobado
- **Alertas Automáticas**: Notificaciones por baja matrícula y fechas próximas
- **Reportes y Estadísticas**: Gráficos de tendencia de matrículas, cursos por facultad, cumplimiento de planes y tasa de aprobación
- **Sistema de Autenticación**: Login con roles (superadmin, admin, coordinator, professor, viewer)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Base de datos**: Neon (PostgreSQL)
- **Charts**: Recharts + shadcn chart
- **Estado**: SWR para data fetching
- **Validación**: Zod + React Hook Form

## Requisitos Previos

- Node.js 18+
- pnpm (o npm/yarn)
- Cuenta en [Neon](https://neon.tech) para la base de datos PostgreSQL

## Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/v0-professional-development-management.git
   cd v0-professional-development-management
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**

   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   DATABASE_URL=postgresql://usuario:password@host.neon.tech/dbname?sslmode=require
   AUTH_SECRET=tu-secret-key-aqui
   ```

   Obtén tu `DATABASE_URL` del panel de Neon:
   - Crea un proyecto en [Neon](https://neon.tech)
   - Ve a **Connection Details**
   - Copia la URL de conexión

   Genera un `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Ejecutar las migraciones**
   ```bash
   pnpm migrate
   ```

5. **Iniciar el servidor de desarrollo**
   ```bash
   pnpm dev
   ```

6. **Acceder a la aplicación**
   Abre [http://localhost:3000](http://localhost:3000)

7. **Credenciales de demo**
   - **Email**: admin@ult.edu.cu
   - **Contraseña**: Admin2024!

## Despliegue en Vercel

### Opción 1: Deploy automático (recomendado)

1. Sube el código a un repositorio en GitHub
2. Ve a [Vercel](https://vercel.com) e importa el repositorio
3. En **Environment Variables**, agrega:
   - `DATABASE_URL` (tu URL de Neon)
   - `AUTH_SECRET` (tu secret generado)
4. Haz clic en **Deploy**

### Opción 2: Deploy desde CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Agrega las variables de entorno desde el dashboard de Vercel.

## Estructura del Proyecto

```
app/
├── api/              # Endpoints de la API
│   ├── alerts/
│   ├── auth/
│   ├── certificates/
│   ├── courses/
│   ├── enrollments/
│   ├── faculties/
│   ├── grades/
│   ├── plans/
│   ├── reports/
│   ├── students/
│   ├── teachers/
│   ├── universities/
│   └── users/
├── panel/            # Panel de administración (ruta /panel)
│   ├── alerts/
│   ├── certificates/
│   ├── courses/
│   ├── documents/
│   ├── enrollments/
│   ├── faculties/
│   ├── plans/
│   ├── reports/
│   ├── students/
│   ├── teachers/
│   ├── universities/
│   └── users/
├── login/            # Página de login
└── page.tsx          # Landing page pública

components/
├── dashboard/        # Componentes del dashboard
└── ui/               # Componentes de shadcn/ui

lib/
├── auth.ts           # Autenticación y sesiones
├── db.ts             # Conexión a la base de datos
└── utils.ts          # Utilidades
```

## Scripts Disponibles

- `pnpm dev` - Iniciar servidor de desarrollo
- `pnpm build` - Construir para producción
- `pnpm start` - Iniciar servidor de producción
- `pnpm migrate` - Ejecutar migraciones de base de datos
- `pnpm lint` - Verificar código con ESLint

## Licencia

MIT