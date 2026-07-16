import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Course,
    Enrollment,
    Evaluation,
    evaluationTypeLabels,
    Grade,
} from '@/types/models';

interface StaffStats {
    students: number;
    activeStudents: number;
    teachers: number;
    subjects: number;
    courses: number;
    activeEnrollments: number;
    averageScore: number;
}

interface DocenteStats {
    courses: number;
    students: number;
    evaluations: number;
}

interface EstudianteStats {
    courses: number;
    averageScore: number;
}

type DashboardProps =
    | {
          view: 'staff';
          stats: StaffStats;
          recentEnrollments: Enrollment[];
          upcomingEvaluations: Evaluation[];
      }
    | {
          view: 'docente';
          stats: DocenteStats;
          myCourses: Course[];
          upcomingEvaluations: Evaluation[];
      }
    | {
          view: 'estudiante';
          stats: EstudianteStats;
          myCourses: Course[];
          myGrades: Grade[];
          upcomingEvaluations: Evaluation[];
      };

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const STARS = [
    { top: '12%', left: '18%', size: 'size-1', delay: '0s' },
    { top: '22%', left: '78%', size: 'size-1.5', delay: '0.4s' },
    { top: '55%', left: '85%', size: 'size-1', delay: '0.9s' },
    { top: '68%', left: '12%', size: 'size-1', delay: '1.3s' },
    { top: '38%', left: '55%', size: 'size-1.5', delay: '0.7s' },
    { top: '80%', left: '65%', size: 'size-1', delay: '1.7s' },
    { top: '15%', left: '48%', size: 'size-1', delay: '2s' },
];

function CalendarCard() {
    const now = new Date();
    const dayName = capitalize(
        now.toLocaleDateString('es-ES', { weekday: 'long' }),
    );
    const monthYear = capitalize(
        now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    );
    const hour = now.getHours();
    const isDaytime = hour >= 6 && hour < 19;

    return (
        <div
            className={`group relative flex size-[360px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg p-6 text-center text-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${
                isDaytime
                    ? 'hover:shadow-yellow-500/20'
                    : 'hover:shadow-blue-400/30'
            }`}
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                style={{
                    backgroundImage: `url(/images/${isDaytime ? 'Day' : 'Night'}.png)`,
                }}
            />
            <div
                className={`absolute inset-0 ${
                    isDaytime ? 'bg-blue-950/45' : 'bg-black/35'
                }`}
            />

            <div className="pointer-events-none absolute inset-0">
                {isDaytime ? (
                    <>
                        <div className="absolute -right-5 -top-5 size-16 animate-sun-pulse rounded-full bg-yellow-300/40 blur-lg transition-all duration-300 group-hover:bg-yellow-200/60" />
                        <div className="absolute -right-2 -top-2 size-8 animate-sun-pulse rounded-full bg-yellow-200/60 blur-sm [animation-delay:0.4s]" />
                    </>
                ) : (
                    STARS.map((star, index) => (
                        <span
                            key={index}
                            className={`absolute animate-twinkle rounded-full bg-white transition-opacity duration-300 group-hover:opacity-100 ${star.size}`}
                            style={{
                                top: star.top,
                                left: star.left,
                                animationDelay: star.delay,
                            }}
                        />
                    ))
                )}
            </div>

            <div className="relative text-lg font-medium">{dayName}</div>
            <div className="relative text-6xl font-bold leading-tight transition-transform duration-300 ease-out group-hover:scale-110">
                {now.getDate()}
            </div>
            <div className="relative text-base text-blue-100">{monthYear}</div>
        </div>
    );
}

function ColorStat({
    label,
    value,
    href,
    className,
}: {
    label: string;
    value: number | string;
    href: string;
    className: string;
}) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center rounded-lg p-4 text-center text-white shadow-sm transition hover:brightness-105 ${className}`}
        >
            <div className="text-3xl font-bold">{value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide">
                {label}
            </div>
        </Link>
    );
}

function UpcomingEvaluationsCard({
    evaluations,
}: {
    evaluations: Evaluation[];
}) {
    return (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Próximas evaluaciones
            </h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {evaluations.map((evaluation) => (
                    <li key={evaluation.id} className="py-2">
                        <Link
                            href={route('courses.show', evaluation.course_id)}
                            className="text-sm text-gray-900 hover:underline dark:text-gray-100"
                        >
                            {evaluation.name} —{' '}
                            {evaluation.course?.subject?.name}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {evaluationTypeLabels[evaluation.type]} ·{' '}
                            {evaluation.date}
                        </div>
                    </li>
                ))}
                {evaluations.length === 0 && (
                    <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                        No hay evaluaciones próximas.
                    </li>
                )}
            </ul>
        </div>
    );
}

export default function Dashboard(props: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Tablero
                </h2>
            }
        >
            <Head title="Tablero" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {props.view === 'staff' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <CalendarCard />
                                <div className="grid flex-1 grid-cols-2 gap-4">
                                    <ColorStat
                                        label="Estudiantes activos"
                                        value={props.stats.activeStudents}
                                        href={route('students.index')}
                                        className="bg-pink-500"
                                    />
                                    <ColorStat
                                        label="Profesores"
                                        value={props.stats.teachers}
                                        href={route('teachers.index')}
                                        className="bg-sky-500"
                                    />
                                    <ColorStat
                                        label="Materias"
                                        value={props.stats.subjects}
                                        href={route('subjects.index')}
                                        className="bg-emerald-500"
                                    />
                                    <ColorStat
                                        label="Cursos"
                                        value={props.stats.courses}
                                        href={route('courses.index')}
                                        className="bg-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                                <div className="col-span-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {props.stats.activeEnrollments}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Matrículas activas
                                    </div>
                                </div>
                                <div className="col-span-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {props.stats.averageScore || '—'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Promedio general
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Matrículas recientes
                                    </h3>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {props.recentEnrollments.map(
                                            (enrollment) => (
                                                <li
                                                    key={enrollment.id}
                                                    className="py-2"
                                                >
                                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                                        {
                                                            enrollment.student
                                                                ?.first_name
                                                        }{' '}
                                                        {
                                                            enrollment.student
                                                                ?.last_name
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {
                                                            enrollment.course
                                                                ?.subject
                                                                ?.name
                                                        }{' '}
                                                        — {enrollment.course?.name}
                                                    </div>
                                                </li>
                                            ),
                                        )}
                                        {props.recentEnrollments.length ===
                                            0 && (
                                            <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                                Aún no hay matrículas
                                                registradas.
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <UpcomingEvaluationsCard
                                    evaluations={props.upcomingEvaluations}
                                />
                            </div>
                        </>
                    )}

                    {props.view === 'docente' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <CalendarCard />
                                <div className="grid flex-1 grid-cols-2 gap-4">
                                    <ColorStat
                                        label="Mis cursos"
                                        value={props.stats.courses}
                                        href={route('courses.index')}
                                        className="bg-sky-500"
                                    />
                                    <ColorStat
                                        label="Estudiantes"
                                        value={props.stats.students}
                                        href={route('courses.index')}
                                        className="bg-pink-500"
                                    />
                                    <ColorStat
                                        label="Evaluaciones"
                                        value={props.stats.evaluations}
                                        href={route('courses.index')}
                                        className="col-span-2 bg-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Mis cursos
                                    </h3>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {props.myCourses.map((course) => (
                                            <li key={course.id} className="py-2">
                                                <Link
                                                    href={route(
                                                        'courses.show',
                                                        course.id,
                                                    )}
                                                    className="text-sm text-gray-900 hover:underline dark:text-gray-100"
                                                >
                                                    {course.name} —{' '}
                                                    {course.subject?.name}
                                                </Link>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {course.period} ·{' '}
                                                    {course.enrollments_count ??
                                                        0}{' '}
                                                    estudiantes
                                                </div>
                                            </li>
                                        ))}
                                        {props.myCourses.length === 0 && (
                                            <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                                No tienes cursos asignados.
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <UpcomingEvaluationsCard
                                    evaluations={props.upcomingEvaluations}
                                />
                            </div>
                        </>
                    )}

                    {props.view === 'estudiante' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <CalendarCard />
                                <div className="grid flex-1 grid-cols-2 gap-4">
                                    <ColorStat
                                        label="Mis cursos"
                                        value={props.stats.courses}
                                        href="#mis-cursos"
                                        className="bg-sky-500"
                                    />
                                    <ColorStat
                                        label="Mi promedio"
                                        value={props.stats.averageScore || '—'}
                                        href="#mis-notas"
                                        className="bg-pink-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div
                                    id="mis-cursos"
                                    className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
                                >
                                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Mis cursos
                                    </h3>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {props.myCourses.map((course) => (
                                            <li key={course.id} className="py-2">
                                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                                    {course.name} —{' '}
                                                    {course.subject?.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {course.teacher
                                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                                        : 'Sin profesor asignado'}
                                                </div>
                                            </li>
                                        ))}
                                        {props.myCourses.length === 0 && (
                                            <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                                No tienes cursos matriculados.
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <div
                                    id="mis-notas"
                                    className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
                                >
                                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Mis calificaciones recientes
                                    </h3>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {props.myGrades.map((grade) => (
                                            <li key={grade.id} className="py-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                                        {grade.evaluation
                                                            ?.name}{' '}
                                                        —{' '}
                                                        {
                                                            grade.evaluation
                                                                ?.course
                                                                ?.subject?.name
                                                        }
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {grade.score}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {props.myGrades.length === 0 && (
                                            <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                                Aún no tienes calificaciones
                                                registradas.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <UpcomingEvaluationsCard
                                evaluations={props.upcomingEvaluations}
                            />
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
