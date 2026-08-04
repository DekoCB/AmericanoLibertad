import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { QrCodeIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';
import { Course, turnoLabels } from '@/types/models';

const SIN_MATERIA = 'Sin curso';

export default function Cursos({
    courses,
    can,
}: {
    courses: Course[];
    can: { viewHistorial: boolean };
}) {
    const bySubject = useMemo(() => {
        const groups = new Map<string, Course[]>();
        courses.forEach((course) => {
            const key = course.subject?.name ?? SIN_MATERIA;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(course);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === SIN_MATERIA) return 1;
            if (b === SIN_MATERIA) return -1;
            return a.localeCompare(b);
        });
    }, [courses]);

    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('courses.asistencias.index', courseId));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <PageTitle icon={<QrCodeIcon />}>Asistencia</PageTitle>
                        <p className="mt-1 text-sm text-brand-muted">
                            Selecciona una sección para tomar asistencia
                            escaneando el DNI o código QR de cada estudiante.
                        </p>
                    </div>
                    {can.viewHistorial && (
                        <Link
                            href={route('asistencias.historial')}
                            className="text-sm text-brand-link hover:underline"
                        >
                            Ver historial de asistencias
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Asistencia" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="max-w-sm">
                        <SearchableSelect
                            value=""
                            onChange={irAlCurso}
                            placeholder="Buscar por sección..."
                            allLabel="Selecciona una sección"
                            options={[...courses]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((course) => {
                                    const docente = course.teacher
                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                        : 'Sin docente';
                                    const turno = course.turno
                                        ? turnoLabels[course.turno]
                                        : '';

                                    return {
                                        value: String(course.id),
                                        label: `${course.name} — ${course.subject?.name ?? ''} · ${docente}${turno ? ` · ${turno}` : ''}`,
                                        searchText: `${course.name} ${course.subject?.name ?? ''} ${docente} ${turno}`,
                                    };
                                })}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {bySubject.map(([subjectName, subjectCourses]) => (
                            <div
                                key={subjectName}
                                className="rounded-[28px] bg-brand-card p-6 shadow-sm"
                            >
                                <h3 className="font-medium text-brand-ink-strong">
                                    {subjectName}
                                </h3>
                                <ul className="mt-3 space-y-1">
                                    {subjectCourses.map((course) => (
                                        <li key={course.id}>
                                            <Link
                                                href={route(
                                                    'courses.asistencias.index',
                                                    course.id,
                                                )}
                                                className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-brand-ink transition hover:bg-brand-hover hover:text-brand-ink-strong"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span>{course.name}</span>
                                                    {course.subject
                                                        ?.ciclo && (
                                                        <span className="whitespace-nowrap rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                            Ciclo{' '}
                                                            {
                                                                course
                                                                    .subject
                                                                    .ciclo
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="whitespace-nowrap text-xs text-brand-muted">
                                                    {course.teacher
                                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                                        : 'Sin docente'}{' '}
                                                    · {course.period}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <div className="col-span-full rounded-[28px] bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                No tienes secciones asignadas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
