import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('[v0] Starting database migration...');

  // Users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      university_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] users table OK');

  // Sessions
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] sessions table OK');

  // Universities
  await sql`
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
    )
  `;
  console.log('[v0] universities table OK');

  // Add FK from users to universities if not exists
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_users_university'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_university
          FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL;
      END IF;
    END
    $$
  `;

  // Permissions
  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource VARCHAR(100) NOT NULL,
      can_read BOOLEAN DEFAULT true,
      can_write BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, resource)
    )
  `;
  console.log('[v0] permissions table OK');

  // Faculties
  await sql`
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
    )
  `;
  console.log('[v0] faculties table OK');

  // Areas
  await sql`
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
    )
  `;
  console.log('[v0] areas table OK');

  // Postgraduate Plans
  await sql`
    CREATE TABLE IF NOT EXISTS postgraduate_plans (
      id SERIAL PRIMARY KEY,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      year INTEGER NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] postgraduate_plans table OK');

  // Teachers
  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      category VARCHAR(100),
      scientific_degree VARCHAR(100),
      specialty VARCHAR(255),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] teachers table OK');

  // Courses
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      plan_id INTEGER REFERENCES postgraduate_plans(id) ON DELETE SET NULL,
      area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
      faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100),
      type VARCHAR(50) NOT NULL DEFAULT 'plan',
      modality VARCHAR(50) DEFAULT 'presencial',
      hours INTEGER DEFAULT 0,
      credits DECIMAL(5,2) DEFAULT 0,
      minimum_enrollment INTEGER DEFAULT 5,
      max_enrollment INTEGER DEFAULT 30,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'planned',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] courses table OK');

  // Course Teachers
  await sql`
    CREATE TABLE IF NOT EXISTS course_teachers (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      role VARCHAR(100) DEFAULT 'instructor',
      hours_assigned INTEGER DEFAULT 0,
      UNIQUE(course_id, teacher_id)
    )
  `;
  console.log('[v0] course_teachers table OK');

  // Students
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      identity_card VARCHAR(50),
      email VARCHAR(255),
      phone VARCHAR(50),
      work_place VARCHAR(255),
      category VARCHAR(100),
      scientific_degree VARCHAR(100),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] students table OK');

  // Enrollments
  await sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      enrollment_date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(50) DEFAULT 'enrolled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(course_id, student_id)
    )
  `;
  console.log('[v0] enrollments table OK');

  // Results
  await sql`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      evaluation_type VARCHAR(100) DEFAULT 'final',
      grade DECIMAL(5,2),
      grade_text VARCHAR(50),
      evaluation_date DATE,
      observations TEXT,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] results table OK');

  // Documents
  await sql`
    CREATE TABLE IF NOT EXISTS course_documents (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      document_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      due_date DATE,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] course_documents table OK');

  // Certificates
  await sql`
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      certificate_number VARCHAR(100) UNIQUE,
      issue_date DATE DEFAULT CURRENT_DATE,
      issued_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('[v0] certificates table OK');

  // ============================================================
  // SEED DATA
  // ============================================================

  // Default university
  const univResult = await sql`
    INSERT INTO universities (name, abbreviation, address, rector)
    VALUES ('Universidad de Las Tunas', 'ULT', 'Vicente García s/n, Las Tunas, Cuba', 'Dr. Pedro García López')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  const univId = univResult.length > 0 ? univResult[0].id : (await sql`SELECT id FROM universities WHERE abbreviation = 'ULT' LIMIT 1`)[0].id;
  console.log('[v0] University seeded, id:', univId);

  // Default admin user (password: Admin1234!)
  await sql`
    INSERT INTO users (name, email, password_hash, role, university_id)
    VALUES ('Administrador', 'admin@ult.edu.cu', '$2b$10$X4kv7j5ZcG30as7gprzR.OJ9XYh/ZRbRCh9MfgJyb6rHhQlS4AEIK', 'admin', ${univId})
    ON CONFLICT (email) DO NOTHING
  `;
  console.log('[v0] Admin user seeded');

  const adminResult = await sql`SELECT id FROM users WHERE email = 'admin@ult.edu.cu' LIMIT 1`;
  const adminId = adminResult[0].id;

  // Admin permissions
  const resources = ['universities','faculties','areas','plans','courses','teachers','enrollments','results','certificates','reports','documents'];
  for (const resource of resources) {
    await sql`
      INSERT INTO permissions (user_id, resource, can_read, can_write)
      VALUES (${adminId}, ${resource}, true, true)
      ON CONFLICT (user_id, resource) DO NOTHING
    `;
  }
  console.log('[v0] Admin permissions seeded');

  // Sample faculties
  const fac1 = await sql`
    INSERT INTO faculties (university_id, name, abbreviation, dean)
    VALUES (${univId}, 'Facultad de Ciencias Técnicas', 'FCT', 'Dr. Carlos Martínez')
    ON CONFLICT DO NOTHING RETURNING id
  `;
  const fac2 = await sql`
    INSERT INTO faculties (university_id, name, abbreviation, dean)
    VALUES (${univId}, 'Facultad de Ciencias Económicas', 'FCE', 'Dra. Ana González')
    ON CONFLICT DO NOTHING RETURNING id
  `;
  const fac3 = await sql`
    INSERT INTO faculties (university_id, name, abbreviation, dean)
    VALUES (${univId}, 'Facultad de Humanidades', 'FH', 'Dr. Luis Ramírez')
    ON CONFLICT DO NOTHING RETURNING id
  `;
  console.log('[v0] Faculties seeded');

  const faculties = await sql`SELECT id, abbreviation FROM faculties WHERE university_id = ${univId} ORDER BY id`;
  const fctId = faculties.find(f => f.abbreviation === 'FCT')?.id;
  const fceId = faculties.find(f => f.abbreviation === 'FCE')?.id;
  const fhId  = faculties.find(f => f.abbreviation === 'FH')?.id;

  // Sample areas
  if (fctId) {
    await sql`INSERT INTO areas (faculty_id, name, abbreviation) VALUES (${fctId}, 'Departamento de Informática', 'INF') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO areas (faculty_id, name, abbreviation) VALUES (${fctId}, 'Departamento de Ingeniería Industrial', 'ING') ON CONFLICT DO NOTHING`;
  }
  if (fceId) {
    await sql`INSERT INTO areas (faculty_id, name, abbreviation) VALUES (${fceId}, 'Departamento de Contabilidad', 'CONT') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO areas (faculty_id, name, abbreviation) VALUES (${fceId}, 'Departamento de Economía', 'ECO') ON CONFLICT DO NOTHING`;
  }
  if (fhId) {
    await sql`INSERT INTO areas (faculty_id, name, abbreviation) VALUES (${fhId}, 'Departamento de Español', 'ESP') ON CONFLICT DO NOTHING`;
  }
  console.log('[v0] Areas seeded');

  // Sample postgraduate plan
  await sql`
    INSERT INTO postgraduate_plans (university_id, faculty_id, name, year, description, status)
    VALUES (${univId}, ${fctId}, 'Plan de Posgrado 2024-2025', 2024, 'Plan anual de superación profesional', 'active')
    ON CONFLICT DO NOTHING
  `;
  console.log('[v0] Postgraduate plan seeded');

  console.log('[v0] Migration completed successfully!');
  console.log('[v0] Admin login: admin@ult.edu.cu / Admin1234!');
}

migrate().catch(err => {
  console.error('[v0] Migration failed:', err);
  process.exit(1);
});
