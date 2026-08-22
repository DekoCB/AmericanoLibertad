import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { ChevronLeftIcon, QrCodeIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Course, turnoLabels } from '@/types/models';

type ViewMode = 'staff' | 'docente';
type Step = 'carrera' | 'curso' | 'seccion';

type SubjectGroup = {
    key: string;
    subjectName: string;
    ciclo: number | null;
    courses: Course[];
};

export default function Cursos({
    courses,
    viewMode,
    can,
}: {
    courses: Course[];
    viewMode: ViewMode;
    can: { viewHistorial: boolean };
}) {
    const porCarrera = useMemo(() => {
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

    const [step, setStep] = useState<Step>('carrera');
    const [selectedCarrera, setSelectedCarrera] = useState<string | null>(
        null,
    );
    const [selectedCursoKey, setSelectedCursoKey] = useState<string | null>(
        null,
    );

    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('courses.asistencias.index', courseId));
    };

    const grupoActual = porCarrera.find(
        ([carreraName]) => carreraName === selectedCarrera,
    )?.[1];
    const cursoActual = grupoActual?.find(
        (group) => group.key === selectedCursoKey,
    );

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
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
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

                    {viewMode === 'staff' ? (
                        <div className="space-y-6">
                            {step !== 'carrera' && (
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-brand-muted">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('carrera');
                                            setSelectedCarrera(null);
                                            setSelectedCursoKey(null);
                                        }}
                                        className="inline-flex items-center gap-1 text-brand-link hover:underline"
                                    >
                                        <ChevronLeftIcon className="size-3.5" />
                                        Carreras
                                    </button>
                                    {step === 'seccion' && selectedCarrera && (
                                        <>
                                            <span>/</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep('curso');
                                                    setSelectedCursoKey(null);
                                                }}
                                                className="text-brand-link hover:underline"
                                            >
                                                {selectedCarrera}
                                            </button>
                                        </>
                                    )}
                                    {step === 'seccion' && cursoActual && (
                                        <>
                                            <span>/</span>
                                            <span className="text-brand-ink-strong">
                                                {cursoActual.subjectName}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 'carrera' && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {porCarrera.map(([carreraName, subjects]) => {
                                        const total = subjects.reduce(
                                            (sum, group) =>
                                                sum + group.courses.length,
                                            0,
                                        );

                                        return (
                                            <button
                                                key={carreraName}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCarrera(
                                                        carreraName,
                                                    );
                                                    setStep('curso');
                                                }}
                                                className="rounded-lg border border-brand-border bg-brand-card p-5 text-left shadow-sm transition hover:border-brand-navy"
                                            >
                                                <p className="font-medium text-brand-ink-strong">
                                                    {carreraName}
                                                </p>
                                                <p className="mt-1 text-xs text-brand-muted">
                                                    {total}{' '}
                                                    {total === 1
                                                        ? 'sección'
                                                        : 'secciones'}
                                                </p>
                                            </button>
                                        );
                                    })}
                                    {porCarrera.length === 0 && (
                                        <div className="col-span-full rounded-lg bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                            No tienes secciones asignadas.
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 'curso' && grupoActual && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {grupoActual.map((group) => (
                                        <button
                                            key={group.key}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCursoKey(
                                                    group.key,
                                                );
                                                setStep('seccion');
                                            }}
                                            className="rounded-lg border border-brand-border bg-brand-card p-5 text-left shadow-sm transition hover:border-brand-navy"
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-brand-ink-strong">
                                                    {group.subjectName}
                                                </p>
                                                {group.ciclo && (
                                                    <span className="whitespace-nowrap rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                        Ciclo {group.ciclo}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-brand-muted">
                                                {group.courses.length}{' '}
                                                {group.courses.length === 1
                                                    ? 'sección'
                                                    : 'secciones'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step === 'seccion' && cursoActual && (
                                <div className="flex flex-wrap gap-2">
                                    {cursoActual.courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={route(
                                                'courses.asistencias.index',
                                                course.id,
                                            )}
                                            className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                                        >
                                            {course.name}
                                            <span className="text-brand-muted">
                                                ·{' '}
                                                {course.enrollments_count ??
                                                    0}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {porCarrera.map(([carreraName, subjects]) => (
                                <div key={carreraName} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-brand-ink-strong">
                                            {carreraName}
                                        </h3>
                                        <span className="rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                            {subjects.reduce(
                                                (sum, group) =>
                                                    sum +
                                                    group.courses.length,
                                                0,
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {subjects.map((group) => (
                                            <div
                                                key={group.key}
                                                className="rounded-lg border border-brand-border bg-brand-card p-5 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-brand-ink-strong">
                                                        {group.subjectName}
                                                    </p>
                                                    {group.ciclo && (
                                                        <span className="whitespace-nowrap rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                            Ciclo{' '}
                                                            {group.ciclo}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {group.courses.map(
                                                        (course) => (
                                                            <Link
                                                                key={
                                                                    course.id
                                                                }
                                                                href={route(
                                                                    'courses.asistencias.index',
                                                                    course.id,
                                                                )}
                                                                className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                                                            >
                                                                {course.name}
                                                                <span className="text-brand-muted">
                                                                    ·{' '}
                                                                    {course.enrollments_count ??
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
                                    No tienes secciones asignadas.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
