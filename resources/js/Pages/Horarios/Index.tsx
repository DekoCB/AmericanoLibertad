import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PageTitle from '@/Components/PageTitle';
import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CalendarDaysIcon,
    EyeIcon,
} from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { DiaSemana, diaSemanaLabels, Horario } from '@/types/models';

type Aula = { aula: string; total: number; horarios: Horario[] };

const ORDEN_DIAS: DiaSemana[] = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
];

function diaSemanaActual(): DiaSemana {
    const dias: DiaSemana[] = [
        'domingo',
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
    ];
    return dias[new Date().getDay()];
}

function VistaPreviaHorario({ aula, horarios }: { aula: string; horarios: Horario[] }) {
    const hoy = diaSemanaActual();
    const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>(hoy);

    const horariosDelDia = useMemo(
        () =>
            horarios
                .filter((h) => h.dia_semana === diaSeleccionado)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
        [horarios, diaSeleccionado],
    );

    return (
        <div className="p-6">
            <h2 className="text-center text-lg font-bold uppercase text-brand-ink-strong">
                {aula}
            </h2>
            <p className="mt-1 text-center text-sm text-brand-muted">
                Vista previa del horario semanal
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {ORDEN_DIAS.map((dia) => {
                    const activo = dia === diaSeleccionado;

                    return (
                        <button
                            key={dia}
                            type="button"
                            onClick={() => setDiaSeleccionado(dia)}
                            className="rounded-lg px-3 py-1 text-xs font-semibold transition"
                            style={{
                                background: activo
                                    ? 'var(--brand-navy)'
                                    : 'var(--brand-hover)',
                                color: activo ? '#fff' : 'var(--brand-muted)',
                            }}
                        >
                            {diaSemanaLabels[dia].slice(0, 3)}
                            {dia === hoy && !activo ? ' •' : ''}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 flex max-h-[360px] flex-col overflow-y-auto">
                {horariosDelDia.map((horario) => (
                    <div
                        key={horario.id}
                        className="flex items-center gap-4 border-b border-brand-border-faint py-3 last:border-b-0"
                    >
                        <div className="w-24 shrink-0 whitespace-nowrap text-sm font-semibold text-brand-ink-strong">
                            {horario.hora_inicio.slice(0, 5)}–
                            {horario.hora_fin.slice(0, 5)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-brand-ink-strong">
                                {horario.course?.subject?.name ?? 'Sin curso'}{' '}
                                — {horario.course?.name ?? 'Sin sección'}
                            </div>
                            <div className="truncate text-[13px] text-brand-muted-soft">
                                {horario.course?.teacher
                                    ? `${horario.course.teacher.first_name} ${horario.course.teacher.last_name}`
                                    : 'Sin docente'}
                            </div>
                        </div>
                    </div>
                ))}
                {horariosDelDia.length === 0 && (
                    <p className="py-6 text-center text-sm text-brand-muted">
                        Sin clases este día.
                    </p>
                )}
            </div>
        </div>
    );
}

function AulaCard({
    aula,
    total,
    horarios,
    canManage,
}: {
    aula: string;
    total: number;
    horarios: Horario[];
    canManage: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previaAbierta, setPreviaAbierta] = useState(false);
    const { data, setData, post, processing, reset } = useForm<{
        archivo: File | null;
    }>({ archivo: null });

    const abrirSelector = () => fileInputRef.current?.click();

    const subirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;
        if (!archivo) return;

        setData('archivo', archivo);
        post(route('horarios.aulas.importar', aula), {
            forceFormData: true,
            onSuccess: () => reset(),
            onFinish: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <div className="border-b border-r border-brand-border bg-brand-card p-6">
            <p className="font-medium text-brand-ink-strong">{aula}</p>
            <p className="mt-1 text-sm text-brand-muted">
                {total} {total === 1 ? 'clase registrada' : 'clases registradas'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <SecondaryButton
                    type="button"
                    onClick={() => setPreviaAbierta(true)}
                    disabled={total === 0}
                    className="inline-flex items-center gap-2 !text-[12px]"
                >
                    <EyeIcon className="size-4" />
                    Vista previa
                </SecondaryButton>

                <a
                    href={route('horarios.aulas.exportar', aula)}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-[12px] font-semibold uppercase tracking-widest text-brand-ink transition hover:bg-brand-hover"
                >
                    <ArrowDownTrayIcon className="size-4" />
                    Descargar Excel
                </a>

                {canManage && (
                    <>
                        <SecondaryButton
                            type="button"
                            onClick={abrirSelector}
                            disabled={processing}
                            className="inline-flex items-center gap-2 !text-[12px]"
                        >
                            <ArrowUpTrayIcon className="size-4" />
                            {processing ? 'Subiendo...' : 'Subir Excel'}
                        </SecondaryButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={subirArchivo}
                        />
                    </>
                )}
            </div>

            <Modal
                show={previaAbierta}
                onClose={() => setPreviaAbierta(false)}
                maxWidth="lg"
            >
                <VistaPreviaHorario aula={aula} horarios={horarios} />
            </Modal>
        </div>
    );
}

export default function Index({
    aulas,
    can,
}: {
    aulas: Aula[];
    can: { manage: boolean };
}) {
    const [creando, setCreando] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
    });

    const registrarAula = (e: FormEvent) => {
        e.preventDefault();
        post(route('horarios.aulas.store'), {
            onSuccess: () => {
                reset();
                setCreando(false);
            },
        });
    };

    const descargarPlantilla = () => {
        if (!data.nombre.trim()) return;
        window.location.href = route(
            'horarios.aulas.exportar',
            data.nombre.trim(),
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CalendarDaysIcon />}>Horarios</PageTitle>
            }
        >
            <Head title="Horarios" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    {can.manage && (
                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setCreando(true)}>
                                Nueva aula
                            </PrimaryButton>
                        </div>
                    )}

                    <div className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t border-brand-border sm:grid-cols-2">
                        {aulas.map(({ aula, total, horarios }) => (
                            <AulaCard
                                key={aula}
                                aula={aula}
                                total={total}
                                horarios={horarios}
                                canManage={can.manage}
                            />
                        ))}
                        {aulas.length === 0 && (
                            <div className="col-span-full border-b border-r border-brand-border bg-brand-card p-6 text-center text-sm text-brand-muted">
                                Todavía no hay aulas con horarios registrados.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                show={creando}
                onClose={() => {
                    setCreando(false);
                    reset();
                }}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva aula
                    </h2>
                    <form onSubmit={registrarAula} className="space-y-4">
                        <div>
                            <TextInput
                                id="nueva_aula"
                                className="block w-full"
                                placeholder="Aula 301"
                                value={data.nombre}
                                onChange={(e) =>
                                    setData('nombre', e.target.value)
                                }
                                isFocused
                            />
                            <InputError
                                message={errors.nombre}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <PrimaryButton
                                type="submit"
                                disabled={!data.nombre.trim() || processing}
                            >
                                Registrar aula
                            </PrimaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={descargarPlantilla}
                                disabled={!data.nombre.trim()}
                            >
                                Descargar plantilla en blanco
                            </SecondaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    setCreando(false);
                                    reset();
                                }}
                            >
                                Cancelar
                            </SecondaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
