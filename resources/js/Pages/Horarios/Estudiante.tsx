import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import { ArrowDownTrayIcon, CalendarDaysIcon } from '@/Components/Icons';
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { DiaSemana, diaSemanaLabels, Horario } from '@/types/models';

const ORDEN_DIAS: DiaSemana[] = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
];

export default function Estudiante({ horarios }: { horarios: Horario[] }) {
    const porDia = useMemo(() => {
        const grupos = new Map<DiaSemana, Horario[]>();
        ORDEN_DIAS.forEach((dia) => grupos.set(dia, []));

        horarios.forEach((horario) => {
            grupos.get(horario.dia_semana)?.push(horario);
        });

        return ORDEN_DIAS.map((dia) => ({
            dia,
            items: grupos.get(dia) ?? [],
        }));
    }, [horarios]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <PageTitle icon={<CalendarDaysIcon />}>
                        Mi horario
                    </PageTitle>
                    <a
                        href={route('horarios.propio.exportar')}
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-xs font-semibold uppercase tracking-widest text-brand-ink transition hover:bg-brand-hover"
                    >
                        <ArrowDownTrayIcon className="size-4" />
                        Descargar Excel
                    </a>
                </div>
            }
        >
            <Head title="Mi horario" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    {porDia.map(({ dia, items }) => (
                        <div
                            key={dia}
                            className="rounded-[20px] border border-brand-border bg-brand-card p-6"
                        >
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                {diaSemanaLabels[dia]}
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {items.map((horario) => (
                                    <li
                                        key={horario.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-border p-3"
                                    >
                                        <div>
                                            <p className="font-medium text-brand-ink-strong">
                                                {horario.course?.subject
                                                    ?.name ?? 'Sin curso'}{' '}
                                                —{' '}
                                                {horario.course?.name ??
                                                    'Sin sección'}
                                            </p>
                                            <p className="text-sm text-brand-muted">
                                                {horario.course?.teacher
                                                    ? `${horario.course.teacher.first_name} ${horario.course.teacher.last_name}`
                                                    : 'Sin docente'}
                                                {horario.aula &&
                                                    ` · ${horario.aula}`}
                                            </p>
                                        </div>
                                        <span className="whitespace-nowrap text-sm font-medium text-brand-ink">
                                            {horario.hora_inicio.slice(0, 5)} -{' '}
                                            {horario.hora_fin.slice(0, 5)}
                                        </span>
                                    </li>
                                ))}
                                {items.length === 0 && (
                                    <li className="py-2 text-sm text-brand-muted">
                                        Sin clases este día.
                                    </li>
                                )}
                            </ul>
                        </div>
                    ))}

                    {horarios.length === 0 && (
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6 text-center text-sm text-brand-muted">
                            Aún no tienes un horario asignado.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
