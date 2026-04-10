-- ============================================================
-- SUPERACIÓN PROFESIONAL - Universidad de Las Tunas
-- Database Schema Migration
-- ============================================================

-- Users and Auth
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, manager, viewer, teacher
  university_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL, -- universities, faculties, areas, plans, courses, teachers, enrollments, results, certificates, reports
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Universities
CREATE TABLE IF NOT EXISTS universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  rector VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update users FK after universities table is created
ALTER TABLE users ADD CONSTRAINT fk_users_university
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL;

-- Faculties
CREATE TABLE IF NOT EXISTS faculties (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(50),
  dean VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Areas (within faculties)
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(50),
  head VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Postgraduate Plans
CREATE TABLE IF NOT EXISTS postgraduate_plans (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  category VARCHAR(100), -- Instructor, Asistente, Auxiliar, Titular
  scientific_degree VARCHAR(100), -- Licenciado, Master, Doctor
  specialty VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES postgraduate_plans(id) ON DELETE SET NULL,
  area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
  faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  type VARCHAR(50) NOT NULL DEFAULT 'plan', -- plan, extraplan
  modality VARCHAR(50) DEFAULT 'presencial', -- presencial, semipresencial, a_distancia
  hours INTEGER DEFAULT 0,
  credits DECIMAL(5,2) DEFAULT 0,
  minimum_enrollment INTEGER DEFAULT 5,
  max_enrollment INTEGER DEFAULT 30,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'planned', -- planned, open, in_progress, completed, cancelled
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Teachers (a course can have multiple teachers)
CREATE TABLE IF NOT EXISTS course_teachers (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'instructor', -- instructor, coordinator
  hours_assigned INTEGER DEFAULT 0,
  UNIQUE(course_id, teacher_id)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  identity_card VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  work_place VARCHAR(255),
  category VARCHAR(100),
  scientific_degree VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments (Matrícula)
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, withdrawn, completed
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Results (Notas)
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  evaluation_type VARCHAR(100) DEFAULT 'final', -- parcial, final, recuperacion
  grade DECIMAL(5,2),
  grade_text VARCHAR(50), -- Aprobado, No aprobado, Excelente, Bien, Regular
  evaluation_date DATE,
  observations TEXT,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents (Otra documentación que el profesor debe entregar)
CREATE TABLE IF NOT EXISTS course_documents (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  document_type VARCHAR(100) NOT NULL, -- programa, acta_evaluacion, informe_final, otro
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, approved
  due_date DATE,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE,
  issue_date DATE DEFAULT CURRENT_DATE,
  issued_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default university
INSERT INTO universities (name, abbreviation, address, rector) VALUES
('Universidad de Las Tunas', 'ULT', 'Vicente García s/n, Las Tunas, Cuba', 'Dr. Pedro García López')
ON CONFLICT DO NOTHING;

-- Default admin user (password: Admin1234!)
INSERT INTO users (name, email, password_hash, role, university_id) VALUES
('Administrador', 'admin@ult.edu.cu', '$2b$10$X4kv7j5ZcG30as7gprzR.OJ9XYh/ZRbRCh9MfgJyb6rHhQlS4AEIK', 'admin', 1)
ON CONFLICT (email) DO NOTHING;

-- Default permissions for admin (all resources)
INSERT INTO permissions (user_id, resource, can_read, can_write)
SELECT 1, resource, true, true
FROM unnest(ARRAY['universities','faculties','areas','plans','courses','teachers','enrollments','results','certificates','reports','documents']) AS resource
ON CONFLICT DO NOTHING;

-- Sample faculties
INSERT INTO faculties (university_id, name, abbreviation, dean) VALUES
(1, 'Facultad de Ciencias Técnicas', 'FCT', 'Dr. Carlos Martínez'),
(1, 'Facultad de Ciencias Económicas', 'FCE', 'Dra. Ana González'),
(1, 'Facultad de Humanidades', 'FH', 'Dr. Luis Ramírez')
ON CONFLICT DO NOTHING;

-- Sample areas
INSERT INTO areas (faculty_id, name, abbreviation) VALUES
(1, 'Departamento de Informática', 'INF'),
(1, 'Departamento de Ingeniería Industrial', 'ING'),
(2, 'Departamento de Contabilidad', 'CONT'),
(2, 'Departamento de Economía', 'ECO'),
(3, 'Departamento de Español', 'ESP')
ON CONFLICT DO NOTHING;
