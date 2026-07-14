# Documentación del Proyecto — AmericanoLibertad

Sistema de gestión educativo construido con Laravel 12, Inertia.js y React
(TypeScript). Todo el frontend se renderiza con componentes `.tsx`; Blade se
usa únicamente para el shell HTML raíz que Inertia requiere.

## 1. Resumen

El sistema permite administrar la operación académica de una institución
educativa: estudiantes, profesores, materias, cursos, matrículas,
evaluaciones y calificaciones, con un dashboard de métricas generales.

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 12 (PHP 8.2+) |
| Puente backend/frontend | Inertia.js v2 (`inertiajs/inertia-laravel`) |
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS 3 |
| Build tool | Vite 7 (`laravel-vite-plugin`) |
| Autenticación | Laravel Breeze (stack React + TypeScript) |
| Base de datos (por defecto) | SQLite (`database/database.sqlite`) |
| Rutas del lado del cliente | Ziggy (expone las rutas de Laravel a React) |

## 3. Requisitos

- PHP >= 8.2 con extensión `pdo_sqlite` (o el driver de BD que se use)
- Composer 2
- Node.js 18+ y npm

> **Nota Windows:** la extensión `pcntl` no existe en builds de PHP para
> Windows. Por eso `laravel/pail` (visor de logs en tiempo real) se quitó
> del script `dev` de `composer.json` — en Windows esa parte del stack
> siempre fallaría. El paquete sigue instalado por si se usa bajo WSL.

## 4. Instalación y arranque

```bash
composer install
npm install
cp .env.example .env      # si no existe ya
php artisan key:generate
php artisan migrate --seed
composer run dev
```

`composer run dev` levanta en paralelo (usando `concurrently`):

- `php artisan serve` → servidor HTTP en `http://127.0.0.1:8000`
- `php artisan queue:listen` → procesamiento de colas
- `npm run dev` → servidor de Vite con HMR en `http://localhost:5173`

Usuario de prueba creado por el seeder: `test@example.com` / contraseña que
se le asigne (el seeder no fija una por defecto; usar `php artisan tinker`
para establecerla o registrarse desde `/register`).

## 5. Estructura relevante de carpetas

```
app/
  Http/Controllers/     Controladores Inertia (uno por entidad)
  Models/                Modelos Eloquent
database/
  migrations/            Esquema de la base de datos
  factories/             Factories para datos de prueba
  seeders/DatabaseSeeder.php   Genera datos de demo coherentes entre sí
resources/
  js/
    Pages/               Páginas .tsx (una carpeta por entidad)
    Layouts/             AuthenticatedLayout, GuestLayout
    Components/          Componentes reutilizables (inputs, botones, paginación)
    types/models.ts       Tipos TypeScript compartidos + etiquetas en español
routes/web.php           Definición de rutas
```

## 6. Modelo de datos

### Tablas principales

| Tabla | Descripción | Campos clave |
|---|---|---|
| `students` | Estudiantes | `document_number` (único), `first_name`, `last_name`, `email` (único), `status` (`active`/`inactive`/`graduated`) |
| `teachers` | Profesores | `first_name`, `last_name`, `email` (único), `specialty` |
| `subjects` | Materias | `name`, `code` (único), `credit_hours` |
| `courses` | Cursos (sección de una materia en un período) | `subject_id`, `teacher_id` (nullable), `period`, `schedule`, `capacity` |
| `enrollments` | Matrículas | `student_id`, `course_id`, `enrolled_at`, `status` (`active`/`withdrawn`/`completed`); único por (`student_id`, `course_id`) |
| `evaluations` | Evaluaciones de un curso | `course_id`, `name`, `type` (`exam`/`quiz`/`homework`/`project`), `weight`, `date`, `max_score` |
| `grades` | Calificaciones | `evaluation_id`, `student_id`, `score`, `comments`; único por (`evaluation_id`, `student_id`) |

### Relaciones (Eloquent)

- `Student` → `hasMany` `Enrollment`, `Grade`
- `Teacher` → `hasMany` `Course`
- `Subject` → `hasMany` `Course`
- `Course` → `belongsTo` `Subject`, `belongsTo` `Teacher`; `hasMany` `Enrollment`, `Evaluation`
- `Enrollment` → `belongsTo` `Student`, `belongsTo` `Course`
- `Evaluation` → `belongsTo` `Course`; `hasMany` `Grade`
- `Grade` → `belongsTo` `Evaluation`, `belongsTo` `Student`

Al eliminar una materia se eliminan en cascada sus cursos; al eliminar un
curso se eliminan en cascada sus matrículas y evaluaciones (y las
calificaciones de esas evaluaciones). Si se elimina un profesor, sus cursos
quedan sin profesor asignado en lugar de eliminarse.

## 7. Rutas principales

Todas bajo el middleware `auth` + `verified` (excepto login/registro):

| Recurso | Rutas |
|---|---|
| `dashboard` | `GET /dashboard` |
| `students` | CRUD estándar (`index/create/store/edit/update/destroy`), sin `show` |
| `teachers` | Igual que `students` |
| `subjects` | Igual que `students` |
| `courses` | CRUD completo incluyendo `show` (detalle del curso) |
| Matrícula | `POST /courses/{course}/enrollments`, `DELETE /courses/{course}/enrollments/{enrollment}` |
| Evaluaciones | `GET/POST /courses/{course}/evaluations(/create)`, `GET/PUT/DELETE /evaluations/{evaluation}` |
| Calificaciones | `GET/PUT /evaluations/{evaluation}/grades` (edición masiva por evaluación) |

## 8. Controladores

Cada controlador (`app/Http/Controllers/*Controller.php`) sigue el mismo
patrón: valida con `Illuminate\Validation\Rule` (incluyendo unicidad
ignorando el registro actual en edición), persiste con Eloquent y responde
con `Inertia::render(...)` pasando los datos ya formateados/paginados.

Casos especiales:

- **`CourseController@show`**: además del curso, entrega matrículas (con
  estudiante cargado), evaluaciones (con conteo de notas) y los estudiantes
  *disponibles* (activos y no matriculados aún) para el selector de
  matrícula.
- **`GradeController@edit`**: entrega solo estudiantes con matrícula
  `active` en ese curso, con su nota/comentario actual si ya existe.
- **`GradeController@update`**: hace `updateOrCreate` por estudiante;
  ignora filas sin nota (`score === null`) para no crear registros vacíos.
- **`DashboardController@index`**: agrega conteos (`Student::count()`, etc.),
  promedio general de notas, matrículas recientes y evaluaciones próximas.

## 9. Frontend (páginas Inertia/React)

Estructura por entidad en `resources/js/Pages/`:

```
Students/   Index.tsx  Create.tsx  Edit.tsx
Teachers/   Index.tsx  Create.tsx  Edit.tsx
Subjects/   Index.tsx  Create.tsx  Edit.tsx
Courses/    Index.tsx  Create.tsx  Edit.tsx  Show.tsx
Evaluations/Create.tsx Edit.tsx
Grades/     Edit.tsx
Dashboard.tsx
```

Piezas compartidas:

- `Components/Pagination.tsx` — pinta los links de paginación que Laravel
  devuelve en la respuesta `paginate()`.
- `types/models.ts` — interfaces TypeScript (`Student`, `Course`, etc.),
  tipo genérico `Paginated<T>` que refleja la forma del paginador de
  Laravel, y diccionarios de etiquetas en español (`studentStatusLabels`,
  `evaluationTypeLabels`, `enrollmentStatusLabels`).

Todos los formularios usan `useForm` de Inertia (manejo de estado, errores
de validación del backend y estados de `processing`). Los listados usan
búsqueda por query string (`router.get(..., { preserveState: true })`) y
confirmación de borrado mediante un modal simple antes de disparar
`delete`.

La navegación principal (Dashboard, Estudiantes, Profesores, Materias,
Cursos) está en `Layouts/AuthenticatedLayout.tsx`, tanto en la versión de
escritorio como en el menú responsive.

## 10. Datos de demostración

`database/seeders/DatabaseSeeder.php` genera, en este orden, un conjunto de
datos coherente entre sí (no aleatorio sin relación):

1. Un usuario de prueba (`test@example.com`).
2. 6 profesores, 10 materias, 40 estudiantes.
3. 2 cursos por materia (20 cursos), cada uno con un profesor asignado al
   azar.
4. Por cada curso: entre 10 y 20 estudiantes matriculados al azar, y 3
   evaluaciones con una calificación por cada estudiante matriculado.

Para regenerar los datos desde cero:

```bash
php artisan migrate:fresh --seed
```

## 11. Notas y decisiones de diseño

- **Por qué Inertia en vez de una SPA separada con API**: mantiene un solo
  proyecto (`composer run dev` arranca todo), reutiliza el enrutamiento,
  sesiones y autenticación de Laravel sin duplicar lógica de auth en el
  frontend, y evita configurar CORS/tokens Sanctum para una SPA externa.
- **Por qué `courses` no tiene `subjects`/`teachers` embebidos como
  sub-recursos**: las materias y profesores se gestionan de forma
  independiente porque se reutilizan entre múltiples cursos y períodos.
- **Unicidad de matrícula y de calificación**: se garantiza a nivel de base
  de datos (constraints `unique`) además de a nivel de formulario, para que
  no se dupliquen matrículas o notas aunque se salte la validación de
  Inertia.

## 12. Posibles próximos pasos

- Roles y permisos (admin / profesor / estudiante) sobre las mismas rutas.
- Exportar boletines de calificaciones (PDF) por estudiante o curso.
- Vista de "mis cursos" para profesores con acceso limitado a sus propios
  cursos.
- Historial de cambios de estado de matrícula.
