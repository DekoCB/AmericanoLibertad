import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CourseThumbnail from '@/Components/CourseThumbnail';
import ImageEditButton from '@/Components/CourseImageEditButton';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { ChevronLeftIcon, ComputerDesktopIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { Course, turnoLabels } from '@/types/models';
import { useEffect, useMemo, useState } from 'react';

type ViewMode = 'staff' | 'docente' | 'estudiante';
type Step = 'carrera' | 'curso';

type SubjectGroup = {
    key: string;
    subjectId: number | null;
    subjectName: string;
    subjectImagenUrl: string | null;
    ciclo: number | null;
    courses: Course[];
};

type CarreraGroup = {
    carreraId: number | null;
    carreraName: string;
    carreraImagenUrl: string | null;
    subjects: SubjectGroup[];
};

export default function Index({
    courses,
    viewMode,
    canManageImagenes,
}: {
    courses: Course[];
    viewMode: ViewMode;
    canManageImagenes: boolean;
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

    const porCarrera = useMemo<CarreraGroup[]>(() => {
        const byCarrera = new Map<
            string,
            {
                id: number | null;
                imagenUrl: string | null;
                subjects: Map<string, SubjectGroup>;
            }
        >();

        cursosDelPeriodo.forEach((course) => {
            const carrera = course.subject?.carrera;
            const carreraName = carrera?.name ?? 'Sin carrera';
            const subjectName = course.subject?.name ?? 'Sin curso';
            const ciclo = course.subject?.ciclo ?? null;
            const key = `${subjectName}__${ciclo ?? ''}`;

            if (!byCarrera.has(carreraName)) {
                byCarrera.set(carreraName, {
                    id: carrera?.id ?? null,
                    imagenUrl: carrera?.imagen_url ?? null,
                    subjects: new Map(),
                });
            }
            const grupo = byCarrera.get(carreraName)!;

            if (!grupo.subjects.has(key)) {
                grupo.subjects.set(key, {
                    key,
                    subjectId: course.subject?.id ?? null,
                    subjectName,
                    subjectImagenUrl: course.subject?.imagen_url ?? null,
                    ciclo,
                    courses: [],
                });
            }
            grupo.subjects.get(key)!.courses.push(course);
        });

        return Array.from(byCarrera.entries())
            .map(([carreraName, grupo]) => ({
                carreraId: grupo.id,
                carreraName,
                carreraImagenUrl: grupo.imagenUrl,
                subjects: Array.from(grupo.subjects.values()).sort(
                    (a, b) =>
                        a.subjectName.localeCompare(b.subjectName) ||
                        (a.ciclo ?? 0) - (b.ciclo ?? 0),
                ),
            }))
            .sort((a, b) => a.carreraName.localeCompare(b.carreraName));
    }, [cursosDelPeriodo]);

    const [step, setStep] = useState<Step>('carrera');
    const [selectedCarrera, setSelectedCarrera] = useState<string | null>(
        null,
    );

    useEffect(() => {
        setStep('carrera');
        setSelectedCarrera(null);
    }, [selectedPeriod]);

    const irAlCurso = (courseId: string) => {
        if (!courseId) return;
        router.visit(route('aula-virtual.show', courseId));
    };

    const carreraActual = porCarrera.find(
        (grupo) => grupo.carreraName === selectedCarrera,
    );

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<ComputerDesktopIcon />}>
                    Aula virtual
                </PageTitle>
            }
        >
            <Head title="Aula virtual" />

            <div className="bg-page-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {viewMode !== 'estudiante' && (
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
                                        className="rounded-lg px-3 py-1 text-xs font-semibold transition"
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

                    {viewMode === 'staff' ? (
                        <div className="space-y-6">
                            {step !== 'carrera' && (
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-brand-muted">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('carrera');
                                            setSelectedCarrera(null);
                                        }}
                                        className="inline-flex items-center gap-1 text-brand-link hover:underline"
                                    >
                                        <ChevronLeftIcon className="size-3.5" />
                                        Carreras
                                    </button>
                                    {selectedCarrera && (
                                        <>
                                            <span>/</span>
                                            <span className="text-brand-ink-strong">
                                                {selectedCarrera}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 'carrera' && (
                                <div className="grid grid-cols-1 border-l border-t border-brand-border sm:grid-cols-2 lg:grid-cols-3">
                                    {porCarrera.map((grupo) => {
                                        const total = grupo.subjects.reduce(
                                            (sum, group) =>
                                                sum + group.courses.length,
                                            0,
                                        );

                                        return (
                                            <div
                                                key={grupo.carreraName}
                                                className="relative"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCarrera(
                                                            grupo.carreraName,
                                                        );
                                                        setStep('curso');
                                                    }}
                                                    className="block w-full border-b border-r border-brand-border bg-brand-card text-left transition hover:bg-brand-hover"
                                                >
                                                    <CourseThumbnail
                                                        imageUrl={
                                                            grupo.carreraImagenUrl
                                                        }
                                                        className="h-28 w-full"
                                                    />
                                                    <div className="p-5">
                                                        <p className="font-medium text-brand-ink-strong">
                                                            {grupo.carreraName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-brand-muted">
                                                            {total}{' '}
                                                            {total === 1
                                                                ? 'sección'
                                                                : 'secciones'}
                                                        </p>
                                                    </div>
                                                </button>
                                                {canManageImagenes &&
                                                    grupo.carreraId && (
                                                        <ImageEditButton
                                                            uploadUrl={route(
                                                                'carreras.imagen.update',
                                                                grupo.carreraId,
                                                            )}
                                                            variant="overlay"
                                                            label=""
                                                        />
                                                    )}
                                            </div>
                                        );
                                    })}
                                    {porCarrera.length === 0 && (
                                        <div className="col-span-full border-b border-r border-brand-border bg-brand-card p-6 text-center text-sm text-brand-muted">
                                            No hay secciones con aula virtual
                                            disponible.
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 'curso' && carreraActual && (
                                <div className="grid grid-cols-1 border-l border-t border-brand-border sm:grid-cols-2 lg:grid-cols-3">
                                    {carreraActual.subjects.map((group) => (
                                        <div
                                            key={group.key}
                                            className="relative border-b border-r border-brand-border bg-brand-card"
                                        >
                                            <CourseThumbnail
                                                imageUrl={
                                                    group.subjectImagenUrl
                                                }
                                                className="h-28 w-full"
                                            />
                                            {canManageImagenes &&
                                                group.subjectId && (
                                                    <ImageEditButton
                                                        uploadUrl={route(
                                                            'subjects.imagen.update',
                                                            group.subjectId,
                                                        )}
                                                        variant="overlay"
                                                        label=""
                                                    />
                                                )}
                                            <div className="p-5">
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
                                                                    'aula-virtual.show',
                                                                    course.id,
                                                                )}
                                                                className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {porCarrera.map((grupo) => (
                                <div
                                    key={grupo.carreraName}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <CourseThumbnail
                                            imageUrl={
                                                grupo.carreraImagenUrl
                                            }
                                            className="size-10 shrink-0 rounded-full"
                                        />
                                        <h3 className="text-lg font-bold text-brand-ink-strong">
                                            {grupo.carreraName}
                                        </h3>
                                        <span className="rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                            {grupo.subjects.reduce(
                                                (sum, group) =>
                                                    sum +
                                                    group.courses.length,
                                                0,
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 border-l border-t border-brand-border sm:grid-cols-2">
                                        {grupo.subjects.map((group) => (
                                            <div
                                                key={group.key}
                                                className="border-b border-r border-brand-border bg-brand-card"
                                            >
                                                <CourseThumbnail
                                                    imageUrl={
                                                        group.subjectImagenUrl
                                                    }
                                                    className="h-36 w-full"
                                                />
                                                <div className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-brand-ink-strong">
                                                            {
                                                                group.subjectName
                                                            }
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
                                                                        'aula-virtual.show',
                                                                        course.id,
                                                                    )}
                                                                    className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                                                                >
                                                                    {
                                                                        course.name
                                                                    }
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {porCarrera.length === 0 && (
                                <div className="rounded-lg bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                    No tienes secciones con aula virtual
                                    disponible.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
