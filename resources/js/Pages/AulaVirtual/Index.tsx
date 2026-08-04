import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { ComputerDesktopIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { Course, turnoLabels } from '@/types/models';
import { useMemo, useState } from 'react';

export default function Index({
    courses,
    isStudent,
}: {
    courses: Course[];
    isStudent: boolean;
}) {
    const periods = useMemo(
        () => [...new Set(courses.map((course) => course.period))],
        [courses],
    );
    const [selectedPeriod, setSelectedPeriod] = useState(periods[0] ?? '');

    const cursosDelPeriodo = useMemo(
        () => courses.filter((course) => course.period === selectedPeriod),
        [courses, selectedPeriod],
    );

    const porCarrera = useMemo(() => {
        type SubjectGroup = {
            key: string;
            subjectName: string;
            ciclo: number | null;
            courses: Course[];
        };

        const byCarrera = new Map<string, Map<string, SubjectGroup>>();

        cursosDelPeriodo.forEach((course) => {
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
    }, [cursosDelPeriodo]);

    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('aula-virtual.show', courseId));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<ComputerDesktopIcon />}>
                    Aula virtual
                </PageTitle>
            }
        >
            <Head title="Aula virtual" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {!isStudent && (
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
                    )}

                    {periods.length > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                            {periods.map((period) => {
                                const activo = period === selectedPeriod;

                                return (
                                    <button
                                        key={period}
                                        type="button"
                                        onClick={() =>
                                            setSelectedPeriod(period)
                                        }
                                        className="rounded-full px-3 py-1 text-xs font-semibold transition"
                                        style={{
                                            background: activo
                                                ? 'var(--brand-navy)'
                                                : 'var(--brand-hover)',
                                            color: activo
                                                ? '#fff'
                                                : 'var(--brand-muted)',
                                        }}
                                    >
                                        {period}
                                    </button>
                                );
                            })}
                        </div>
                    )}

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
                                                                'aula-virtual.show',
                                                                course.id,
                                                            )}
                                                            className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                                                        >
                                                            {course.name}
                                                            <span className="text-brand-muted">
                                                                ·{' '}
                                                                {course.recursos_aula_count ??
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
                                No tienes secciones con aula virtual disponible.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
