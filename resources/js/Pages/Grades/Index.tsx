import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { CheckBadgeIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { Course } from '@/types/models';
import { useMemo } from 'react';

export default function Index({
    courses,
    isDocente,
}: {
    courses: Course[];
    isDocente: boolean;
}) {
    const porCarrera = useMemo(() => {
        type SubjectGroup = {
            key: string;
            subjectName: string;
            ciclo: number | null;
            courses: Course[];
        };

        const byCarrera = new Map<string, Map<string, SubjectGroup>>();

        courses.forEach((course) => {
            const carreraName = course.subject?.carrera?.name ?? 'Sin carrera';
            const subjectName = course.subject?.name ?? 'Sin curso';
            const ciclo = course.subject?.ciclo ?? null;
            const key = `${subjectName}__${ciclo ?? ''}`;

            if (!byCarrera.has(carreraName)) {
                byCarrera.set(carreraName, new Map());
            }
            const bySubject = byCarrera.get(carreraName)!;

            if (!bySubject.has(key)) {
                bySubject.set(key, { key, subjectName, ciclo, courses: [] });
            }
            bySubject.get(key)!.courses.push(course);
        });

        return Array.from(byCarrera.entries())
            .map(
                ([carreraName, bySubject]) =>
                    [
                        carreraName,
                        Array.from(bySubject.values()).sort(
                            (a, b) =>
                                a.subjectName.localeCompare(b.subjectName) ||
                                (a.ciclo ?? 0) - (b.ciclo ?? 0),
                        ),
                    ] as const,
            )
            .sort(([a], [b]) => a.localeCompare(b));
    }, [courses]);

    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('grades.show', courseId));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CheckBadgeIcon />}>
                    {isDocente ? 'Mis notas' : 'Notas'}
                </PageTitle>
            }
        >
            <Head title="Notas" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="max-w-sm">
                        <SearchableSelect
                            value=""
                            onChange={irAlCurso}
                            placeholder="Buscar por curso o sección..."
                            allLabel="Selecciona una sección"
                            options={[...courses]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((course) => {
                                    const docente = course.teacher
                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                        : 'Sin docente';

                                    return {
                                        value: String(course.id),
                                        label: `${course.name} — ${course.subject?.name ?? ''} · ${docente}`,
                                        searchText: `${course.name} ${course.subject?.name ?? ''} ${docente}`,
                                    };
                                })}
                        />
                    </div>

                    <div className="space-y-10">
                        {porCarrera.map(([carreraName, subjects]) => (
                            <div key={carreraName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-brand-ink-strong">
                                        {carreraName}
                                    </h3>
                                    <span className="rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                        {subjects.reduce(
                                            (sum, group) =>
                                                sum + group.courses.length,
                                            0,
                                        )}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {subjects.map((group) => (
                                        <div
                                            key={group.key}
                                            className="rounded-[20px] border border-brand-border bg-brand-card p-5 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-brand-ink-strong">
                                                    {group.subjectName}
                                                </p>
                                                {group.ciclo && (
                                                    <span className="whitespace-nowrap rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                        Ciclo {group.ciclo}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {group.courses.map(
                                                    (course) => (
                                                        <Link
                                                            key={course.id}
                                                            href={route(
                                                                'grades.show',
                                                                course.id,
                                                            )}
                                                            className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                                                        >
                                                            {course.name}
                                                            <span className="text-brand-muted">
                                                                ·{' '}
                                                                {course.evaluations_count ??
                                                                    0}
                                                            </span>
                                                        </Link>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {porCarrera.length === 0 && (
                            <div className="rounded-lg bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                No tienes secciones con evaluaciones disponibles.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
