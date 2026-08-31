import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import TextInput from '@/Components/TextInput';
import { ChevronLeftIcon, XMarkIcon, CalendarDaysIcon } from '@/Components/Icons';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DragEvent, useMemo, useState } from 'react';
import { Course, DiaSemana, diaSemanaLabels, Horario } from '@/types/models';
import { PageProps } from '@/types';

const ORDEN_DIAS: DiaSemana[] = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
];

type DragPayload =
    | { type: 'new-course'; courseId: number }
    | { type: 'move-horario'; horarioId: number; courseId: number; duracion: number };

function horaLabel(hora: number): string {
    return `${String(hora).padStart(2, '0')}:00`;
}

function duracionEnHoras(horario: Horario): number {
    const [hIni] = horario.hora_inicio.split(':').map(Number);
    const [hFin] = horario.hora_fin.split(':').map(Number);
    return Math.max(1, hFin - hIni);
}

export default function Grid({
    aula,
    horarios,
    cursos,
    horaMin,
    horaMax,
    can,
}: {
    aula: string;
    horarios: Horario[];
    cursos: Course[];
    horaMin: number;
    horaMax: number;
    can: { manage: boolean };
}) {
    const { flash } = usePage<PageProps>().props;
    const [busqueda, setBusqueda] = useState('');
    const [celdaActiva, setCeldaActiva] = useState<string | null>(null);

    const horas = useMemo(() => {
        const lista: number[] = [];
        for (let h = horaMin; h <= horaMax; h++) lista.push(h);
        return lista;
    }, [horaMin, horaMax]);

    const cursosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return cursos;
        return cursos.filter((c) =>
            `${c.subject?.name ?? ''} ${c.name}`.toLowerCase().includes(texto),
        );
    }, [cursos, busqueda]);

    const horarioEn = (dia: DiaSemana, hora: number) =>
        horarios.find(
            (h) => h.dia_semana === dia && Number(h.hora_inicio.slice(0, 2)) === hora,
        );

    const mover = (payload: DragPayload, dia: DiaSemana, hora: number) => {
        const horaInicio = horaLabel(hora);

        if (payload.type === 'new-course') {
            router.post(
                route('courses.horarios.store', payload.courseId),
                {
                    dia_semana: dia,
                    hora_inicio: horaInicio,
                    hora_fin: horaLabel(hora + 1),
                    aula_nombre: aula,
                },
                { preserveScroll: true, preserveState: true, only: ['horarios', 'flash'] },
            );
            return;
        }

        router.put(
            route('courses.horarios.update', [payload.courseId, payload.horarioId]),
            {
                dia_semana: dia,
                hora_inicio: horaInicio,
                hora_fin: horaLabel(hora + payload.duracion),
                aula_nombre: aula,
            },
            { preserveScroll: true, preserveState: true, only: ['horarios', 'flash'] },
        );
    };

    const quitar = (horario: Horario) => {
        router.delete(
            route('courses.horarios.destroy', [horario.course_id, horario.id]),
            { preserveScroll: true, preserveState: true, only: ['horarios', 'flash'] },
        );
    };

    const onDragStartCurso = (e: DragEvent, course: Course) => {
        const payload: DragPayload = { type: 'new-course', courseId: course.id };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const onDragStartChip = (e: DragEvent, horario: Horario) => {
        const payload: DragPayload = {
            type: 'move-horario',
            horarioId: horario.id,
            courseId: horario.course_id,
            duracion: duracionEnHoras(horario),
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = (e: DragEvent, dia: DiaSemana, hora: number) => {
        e.preventDefault();
        setCeldaActiva(null);
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return;

        try {
            const payload: DragPayload = JSON.parse(raw);
            mover(payload, dia, hora);
        } catch {
            // dato de arrastre inválido, se ignora
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CalendarDaysIcon />}>
                    Horario — {aula}
                </PageTitle>
            }
        >
            <Head title={`Horario — ${aula}`} />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <Link
                        href={route('horarios.index')}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-link hover:underline"
                    >
                        <ChevronLeftIcon className="size-4" />
                        Volver a Horarios
                    </Link>

                    {flash.success && (
                        <div className="rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-800">
                            {flash.error}
                        </div>
                    )}

                    {!can.manage && (
                        <div className="rounded-lg border border-brand-border bg-brand-card px-4 py-3 text-sm text-brand-muted">
                            Solo puedes visualizar esta grilla. No tienes
                            permiso para modificar el horario.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="rounded-lg border border-brand-border bg-brand-card p-4">
                            <h3 className="font-bold text-brand-ink-strong">
                                Cursos
                            </h3>
                            <p className="mt-1 text-xs text-brand-muted">
                                {can.manage
                                    ? 'Arrastra un curso hacia la celda del horario que le corresponda.'
                                    : 'Vista de solo lectura.'}
                            </p>

                            <div className="mt-3">
                                <TextInput
                                    className="block w-full"
                                    placeholder="Buscar curso o sección..."
                                    value={busqueda}
                                    onChange={(e) =>
                                        setBusqueda(e.target.value)
                                    }
                                />
                            </div>

                            <div className="mt-3 max-h-[560px] space-y-1.5 overflow-y-auto">
                                {cursosFiltrados.map((course) => (
                                    <div
                                        key={course.id}
                                        draggable={can.manage}
                                        onDragStart={(e) =>
                                            onDragStartCurso(e, course)
                                        }
                                        className={`rounded-lg border border-brand-border bg-brand-hover px-3 py-2 text-xs ${
                                            can.manage
                                                ? 'cursor-grab active:cursor-grabbing'
                                                : ''
                                        }`}
                                    >
                                        <p className="font-semibold text-brand-ink-strong">
                                            {course.subject?.name ??
                                                'Sin materia'}
                                        </p>
                                        <p className="text-brand-muted">
                                            {course.name}
                                            {course.teacher
                                                ? ` · ${course.teacher.first_name} ${course.teacher.last_name}`
                                                : ''}
                                        </p>
                                    </div>
                                ))}
                                {cursosFiltrados.length === 0 && (
                                    <p className="py-4 text-center text-xs text-brand-muted">
                                        No se encontraron cursos.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                            <div
                                className="grid min-w-[860px]"
                                style={{
                                    gridTemplateColumns: `88px repeat(${ORDEN_DIAS.length}, 1fr)`,
                                    gridTemplateRows: `auto repeat(${horas.length}, 56px)`,
                                }}
                            >
                                <div className="border-b border-r border-brand-border bg-brand-thead" />
                                {ORDEN_DIAS.map((dia, i) => (
                                    <div
                                        key={dia}
                                        className="border-b border-brand-border bg-brand-thead px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-muted"
                                        style={{
                                            gridColumn: i + 2,
                                            gridRow: 1,
                                        }}
                                    >
                                        {diaSemanaLabels[dia]}
                                    </div>
                                ))}

                                {horas.map((hora, hi) => (
                                    <div
                                        key={`label-${hora}`}
                                        className="border-r border-t border-brand-border-faint px-2 py-1 text-right text-[11px] text-brand-muted"
                                        style={{ gridColumn: 1, gridRow: hi + 2 }}
                                    >
                                        {horaLabel(hora)}
                                    </div>
                                ))}

                                {ORDEN_DIAS.map((dia, di) =>
                                    horas.map((hora, hi) => {
                                        const key = `${dia}-${hora}`;
                                        const ocupada = horarioEn(dia, hora);
                                        const cubierta = horarios.some((h) => {
                                            if (h.dia_semana !== dia) return false;
                                            const inicio = Number(
                                                h.hora_inicio.slice(0, 2),
                                            );
                                            return (
                                                hora > inicio &&
                                                hora < inicio + duracionEnHoras(h)
                                            );
                                        });

                                        if (cubierta) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={key}
                                                onDragOver={(e) => {
                                                    if (!can.manage || ocupada) return;
                                                    e.preventDefault();
                                                    setCeldaActiva(key);
                                                }}
                                                onDragLeave={() =>
                                                    setCeldaActiva((c) =>
                                                        c === key ? null : c,
                                                    )
                                                }
                                                onDrop={(e) => {
                                                    if (!can.manage || ocupada) return;
                                                    onDrop(e, dia, hora);
                                                }}
                                                className={`relative border-b border-r border-brand-border-faint p-1 transition-colors ${
                                                    celdaActiva === key
                                                        ? 'bg-brand-hover'
                                                        : ''
                                                }`}
                                                style={{
                                                    gridColumn: di + 2,
                                                    gridRow: `${hi + 2} / span ${
                                                        ocupada
                                                            ? duracionEnHoras(ocupada)
                                                            : 1
                                                    }`,
                                                }}
                                            >
                                                {ocupada && (
                                                    <div
                                                        draggable={can.manage}
                                                        onDragStart={(e) =>
                                                            onDragStartChip(
                                                                e,
                                                                ocupada,
                                                            )
                                                        }
                                                        className={`group flex h-full flex-col justify-center rounded-md bg-brand-navy px-2 py-1 text-white ${
                                                            can.manage
                                                                ? 'cursor-grab active:cursor-grabbing'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <p className="truncate text-[11px] font-semibold leading-tight">
                                                                {ocupada.course
                                                                    ?.subject
                                                                    ?.name ??
                                                                    'Sin curso'}
                                                            </p>
                                                            {can.manage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        quitar(
                                                                            ocupada,
                                                                        )
                                                                    }
                                                                    className="shrink-0 opacity-70 hover:opacity-100"
                                                                    aria-label="Quitar clase"
                                                                    title="Quitar clase"
                                                                >
                                                                    <XMarkIcon className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-[10px] text-white/80">
                                                            {ocupada.course
                                                                ?.name ??
                                                                'Sin sección'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
