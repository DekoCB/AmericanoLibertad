import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, Link, router } from '@inertiajs/react';
import { Course, turnoLabels } from '@/types/models';

export default function Index({
    courses,
    isStudent,
}: {
    courses: Course[];
    isStudent: boolean;
}) {
    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('aula-virtual.show', courseId));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Aula virtual
                </h2>
            }
        >
            <Head title="Aula virtual" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    {!isStudent && (
                        <div className="max-w-sm">
                            <SearchableSelect
                                value=""
                                onChange={irAlCurso}
                                placeholder="Buscar por curso..."
                                allLabel="Selecciona un curso"
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
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={route('aula-virtual.show', course.id)}
                                className="rounded-lg bg-brand-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="font-medium text-brand-ink-strong">
                                    {course.name} — {course.subject?.name}
                                </p>
                                <p className="mt-1 text-sm text-brand-muted">
                                    {course.teacher
                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                        : 'Sin docente'}{' '}
                                    · {course.period}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-brand-link">
                                    {course.recursos_aula_count ?? 0} recursos
                                </p>
                            </Link>
                        ))}
                        {courses.length === 0 && (
                            <div className="col-span-full rounded-lg bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                No tienes cursos con aula virtual disponible.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
