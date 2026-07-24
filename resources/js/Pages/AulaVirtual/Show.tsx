import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { ChevronDownIcon, TrashIcon } from '@/Components/Icons';
import { Disclosure, Transition } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useRef, useState } from 'react';
import {
    Course,
    EntregaEvaluacion,
    Evaluation,
    evaluationTypeLabels,
    RecursoAula,
    recursoTipoLabels,
} from '@/types/models';
import { formatDate, formatDateTime } from '@/utils/date';

const tipoBadge: Record<RecursoAula['tipo'], string> = {
    anuncio: 'bg-blue-100 text-blue-800',
    enlace: 'bg-purple-100 text-purple-800',
    archivo: 'bg-emerald-100 text-emerald-800',
};

const evaluacionBadge: Record<Evaluation['type'], string> = {
    exam: 'bg-rose-100 text-rose-800',
    quiz: 'bg-amber-100 text-amber-800',
    homework: 'bg-sky-100 text-sky-800',
    project: 'bg-violet-100 text-violet-800',
};

const SIN_SEMANA = 'sin-semana';
const TOTAL_SEMANAS = 16;

function parseFechaLocal(fecha: string): Date {
    const [y, m, d] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
}

function diasRestantes(fecha: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const objetivo = parseFechaLocal(fecha);
    return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}

function etiquetaDias(dias: number): string {
    if (dias < 0) {
        return `Vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
    }
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
}

function estiloAlerta(dias: number): string {
    if (dias < 0) return 'border-red-300 bg-red-50 text-red-800';
    if (dias <= 2) return 'border-amber-300 bg-amber-50 text-amber-800';
    return 'border-brand-border bg-brand-card text-brand-ink';
}

function RecursoForm({
    course,
    defaultSemana,
    onDone,
}: {
    course: Course;
    defaultSemana?: number | null;
    onDone: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, reset } = useForm<{
        semana: string;
        titulo: string;
        tipo: string;
        entregable: boolean;
        fecha_entrega: string;
        descripcion: string;
        url: string;
        archivo: File | null;
    }>({
        semana: defaultSemana ? String(defaultSemana) : '',
        titulo: '',
        tipo: 'anuncio',
        entregable: false,
        fecha_entrega: '',
        descripcion: '',
        url: '',
        archivo: null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('aula-virtual.store', course.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="semana" value="Semana (opcional)" />
                    <TextInput
                        id="semana"
                        type="number"
                        min={1}
                        max={TOTAL_SEMANAS}
                        className="mt-1 block w-full"
                        value={data.semana}
                        onChange={(e) => setData('semana', e.target.value)}
                    />
                    <InputError message={errors.semana} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="tipo" value="Tipo" />
                    <select
                        id="tipo"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.tipo}
                        onChange={(e) => setData('tipo', e.target.value)}
                    >
                        {Object.entries(recursoTipoLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="titulo" value="Título" />
                    <TextInput
                        id="titulo"
                        className="mt-1 block w-full"
                        value={data.titulo}
                        onChange={(e) => setData('titulo', e.target.value)}
                    />
                    <InputError message={errors.titulo} className="mt-1" />
                </div>
                {data.tipo !== 'anuncio' && (
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="url" value="URL" />
                        <TextInput
                            id="url"
                            type="url"
                            placeholder="https://..."
                            className="mt-1 block w-full"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                        />
                        <InputError message={errors.url} className="mt-1" />
                    </div>
                )}
                {data.tipo === 'archivo' && (
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="archivo"
                            value="O sube un archivo"
                        />
                        <input
                            ref={fileInputRef}
                            id="archivo"
                            type="file"
                            className="mt-1 block w-full text-sm text-brand-ink"
                            onChange={(e) =>
                                setData(
                                    'archivo',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                        />
                        <InputError
                            message={errors.archivo}
                            className="mt-1"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                        id="entregable"
                        type="checkbox"
                        checked={data.entregable}
                        onChange={(e) => setData('entregable', e.target.checked)}
                        className="rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                    />
                    <label
                        htmlFor="entregable"
                        className="text-sm font-medium text-brand-ink-strong"
                    >
                        Es un entregable (los estudiantes verán una alerta)
                    </label>
                </div>
                {data.entregable && (
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="fecha_entrega"
                            value="Fecha de entrega"
                        />
                        <DateInput
                            id="fecha_entrega"
                            className="mt-1 block w-full"
                            value={data.fecha_entrega}
                            onChange={(v) => setData('fecha_entrega', v)}
                        />
                        <InputError
                            message={errors.fecha_entrega}
                            className="mt-1"
                        />
                    </div>
                )}
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="descripcion" value="Descripción" />
                    <textarea
                        id="descripcion"
                        rows={3}
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                    />
                    <InputError message={errors.descripcion} className="mt-1" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>Publicar</PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

function RecursoItem({
    recurso,
    canManage,
    onDelete,
    anchorId,
}: {
    recurso: RecursoAula;
    canManage: boolean;
    onDelete: (id: number) => void;
    anchorId?: string;
}) {
    return (
        <li
            id={anchorId}
            className="scroll-mt-20 rounded-md border border-brand-border p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadge[recurso.tipo]}`}
                        >
                            {recursoTipoLabels[recurso.tipo]}
                        </span>
                        {recurso.entregable && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                Entregable
                                {recurso.fecha_entrega &&
                                    ` · vence ${formatDate(recurso.fecha_entrega)}`}
                            </span>
                        )}
                        <p className="font-medium text-brand-ink-strong">
                            {recurso.titulo}
                        </p>
                    </div>
                    {recurso.descripcion && (
                        <p className="mt-1 whitespace-pre-line text-sm text-brand-muted">
                            {recurso.descripcion}
                        </p>
                    )}
                    {recurso.url && (
                        <a
                            href={recurso.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-sm text-brand-link hover:underline"
                        >
                            {recurso.url}
                        </a>
                    )}
                    {recurso.archivo_url && (
                        <a
                            href={recurso.archivo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-sm text-brand-link hover:underline"
                        >
                            Descargar: {recurso.archivo_nombre}
                        </a>
                    )}
                    <p className="mt-1 text-xs text-brand-muted-soft">
                        {formatDateTime(recurso.created_at)}
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => onDelete(recurso.id)}
                        className="shrink-0 text-sm text-red-600 hover:opacity-70"
                        title="Eliminar"
                        aria-label="Eliminar"
                    >
                        <TrashIcon className="size-4" />
                    </button>
                )}
            </div>
        </li>
    );
}

function EntregaUploader({
    evaluacionId,
    entrega,
}: {
    evaluacionId: number;
    entrega?: EntregaEvaluacion | null;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors } = useForm<{
        archivo: File | null;
    }>({
        archivo: null,
    });

    const submit = () => {
        if (!data.archivo) return;
        post(route('evaluations.entrega.store', evaluacionId), {
            forceFormData: true,
            onSuccess: () => {
                setData('archivo', null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <div className="mt-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
                {entrega && (
                    <span className="text-brand-muted">
                        Entrega enviada: {entrega.nombre_original} ·{' '}
                        {formatDateTime(entrega.enviado_at)}
                    </span>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                        setData('archivo', e.target.files?.[0] ?? null)
                    }
                />
                <SecondaryButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {entrega ? 'Reemplazar entrega' : 'Subir entrega'}
                </SecondaryButton>
                {data.archivo && (
                    <>
                        <span className="text-brand-muted">
                            {data.archivo.name}
                        </span>
                        <PrimaryButton
                            type="button"
                            onClick={submit}
                            disabled={processing}
                        >
                            Enviar
                        </PrimaryButton>
                    </>
                )}
            </div>
            <InputError message={errors.archivo} className="mt-1" />
        </div>
    );
}

function EvaluacionItem({
    evaluacion,
    isStudent,
    canManage,
}: {
    evaluacion: Evaluation;
    isStudent: boolean;
    canManage: boolean;
}) {
    return (
        <li className="rounded-md border border-brand-border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${evaluacionBadge[evaluacion.type]}`}
                >
                    Evaluación · {evaluationTypeLabels[evaluacion.type]}
                </span>
                <p className="font-medium text-brand-ink-strong">
                    {evaluacion.name}
                </p>
            </div>
            <p className="mt-1 text-sm text-brand-muted">
                {formatDate(evaluacion.date)} · Ponderación{' '}
                {evaluacion.weight}%
            </p>

            {(evaluacion.type === 'homework' || evaluacion.type === 'project') &&
                isStudent && (
                    <EntregaUploader
                        evaluacionId={evaluacion.id}
                        entrega={evaluacion.mi_entrega}
                    />
                )}

            {evaluacion.type === 'quiz' && isStudent && (
                <p className="mt-2 text-sm">
                    {evaluacion.mi_intento ? (
                        <span className="text-brand-muted">
                            Ya resuelto · Puntaje: {evaluacion.mi_intento.puntaje}/
                            {evaluacion.max_score}
                        </span>
                    ) : (evaluacion.preguntas_count ?? 0) > 0 ? (
                        <Link
                            href={route(
                                'evaluations.resolver',
                                evaluacion.id,
                            )}
                            className="text-brand-link hover:underline"
                        >
                            Resolver cuestionario
                        </Link>
                    ) : (
                        <span className="text-brand-muted">
                            El docente aún no publicó las preguntas.
                        </span>
                    )}
                </p>
            )}

            {evaluacion.type === 'quiz' && canManage && (
                <Link
                    href={route('evaluations.preguntas.index', evaluacion.id)}
                    className="mt-2 inline-block text-sm text-brand-link hover:underline"
                >
                    Gestionar preguntas
                    {evaluacion.preguntas_count !== undefined &&
                        ` (${evaluacion.preguntas_count})`}
                </Link>
            )}
        </li>
    );
}

function NavegacionSemanas({
    porSemana,
}: {
    porSemana: [number | typeof SIN_SEMANA, RecursoAula[]][];
}) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-brand-ink-strong">
                Contenido del curso
            </h3>
            <div className="divide-y divide-brand-border-faint rounded-[20px] border border-brand-border bg-brand-card">
                {porSemana.map(([semana, items]) => (
                    <Disclosure
                        key={semana}
                        as="div"
                        defaultOpen
                        className="p-4"
                    >
                        {({ open }) => (
                            <>
                                <div className="flex items-center gap-2">
                                    <Disclosure.Button
                                        className="rounded p-0.5 text-brand-ink-strong transition hover:bg-brand-hover"
                                        aria-label={
                                            open
                                                ? 'Contraer'
                                                : 'Expandir'
                                        }
                                    >
                                        <ChevronDownIcon
                                            className={`size-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                                        />
                                    </Disclosure.Button>
                                    <a
                                        href={`#semana-${semana}`}
                                        className="font-medium text-brand-ink-strong hover:text-brand-link hover:underline"
                                    >
                                        {semana === SIN_SEMANA
                                            ? 'General'
                                            : `Semana ${semana}`}
                                    </a>
                                </div>
                                <Transition
                                    as="div"
                                    show={open}
                                    enter="transition-all duration-300 ease-out"
                                    enterFrom="opacity-0 max-h-0"
                                    enterTo="opacity-100 max-h-96"
                                    leave="transition-all duration-200 ease-in"
                                    leaveFrom="opacity-100 max-h-96"
                                    leaveTo="opacity-0 max-h-0"
                                    className="overflow-hidden"
                                >
                                    <Disclosure.Panel static>
                                        <ul className="ml-6 mt-2 space-y-1 border-l border-brand-border-faint pl-3">
                                            {items.map((recurso) => (
                                                <li key={recurso.id}>
                                                    <a
                                                        href={`#recurso-${recurso.id}`}
                                                        className="text-sm text-brand-muted hover:text-brand-link hover:underline"
                                                    >
                                                        {recurso.titulo}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </Disclosure.Panel>
                                </Transition>
                            </>
                        )}
                    </Disclosure>
                ))}
            </div>
        </div>
    );
}

function AlertasPanel({ recursos }: { recursos: RecursoAula[] }) {
    const alertas = useMemo(
        () =>
            recursos
                .filter((r) => r.entregable && r.fecha_entrega)
                .map((r) => ({
                    recurso: r,
                    dias: diasRestantes(r.fecha_entrega as string),
                }))
                .sort((a, b) => a.dias - b.dias),
        [recursos],
    );

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-brand-ink-strong">
                Actividades pendientes
            </h3>
            {alertas.length === 0 && (
                <div className="rounded-[20px] border border-brand-border bg-brand-card p-4 text-sm text-brand-muted">
                    No tienes entregables pendientes.
                </div>
            )}
            {alertas.map(({ recurso, dias }) => (
                <div
                    key={recurso.id}
                    className={`rounded-[20px] border p-4 ${estiloAlerta(dias)}`}
                >
                    <p className="font-medium">{recurso.titulo}</p>
                    <p className="mt-1 text-xs font-semibold">
                        {etiquetaDias(dias)}
                    </p>
                    {recurso.semana !== null && (
                        <p className="mt-1 text-xs opacity-75">
                            Semana {recurso.semana}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Show({
    course,
    recursos,
    evaluaciones,
    can,
    isStudent,
}: {
    course: Course;
    recursos: RecursoAula[];
    evaluaciones: Evaluation[];
    can: { manage: boolean };
    isStudent: boolean;
}) {
    const [addingTo, setAddingTo] = useState<number | typeof SIN_SEMANA | null>(
        null,
    );
    const [addModalOpen, setAddModalOpen] = useState(false);
    const { delete: destroy } = useForm();

    const deleteRecurso = (recursoId: number) => {
        if (!confirm('¿Eliminar este recurso?')) return;
        destroy(route('aula-virtual.destroy', [course.id, recursoId]));
    };

    const porSemana = useMemo(() => {
        const grupos = new Map<number | typeof SIN_SEMANA, RecursoAula[]>();
        grupos.set(SIN_SEMANA, []);
        for (let semana = 1; semana <= TOTAL_SEMANAS; semana++) {
            grupos.set(semana, []);
        }

        recursos.forEach((recurso) => {
            const key = recurso.semana ?? SIN_SEMANA;
            if (!grupos.has(key)) grupos.set(key, []);
            grupos.get(key)!.push(recurso);
        });

        return Array.from(grupos.entries()).sort(([a], [b]) => {
            if (a === SIN_SEMANA) return -1;
            if (b === SIN_SEMANA) return 1;
            return (a as number) - (b as number);
        });
    }, [recursos]);

    const evaluacionesPorSemana = useMemo(() => {
        const grupos = new Map<number, Evaluation[]>();
        evaluaciones.forEach((evaluacion) => {
            if (evaluacion.semana == null) return;
            if (!grupos.has(evaluacion.semana)) grupos.set(evaluacion.semana, []);
            grupos.get(evaluacion.semana)!.push(evaluacion);
        });
        return grupos;
    }, [evaluaciones]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Aula virtual — {course.name}
                    </h2>
                    <Link
                        href={route('aula-virtual.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Aula virtual — ${course.name}`} />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="flex-1 space-y-6">
                            {porSemana.map(([semana, items]) => {
                                const evaluacionesSemana =
                                    semana === SIN_SEMANA
                                        ? []
                                        : (evaluacionesPorSemana.get(semana) ??
                                          []);

                                return (
                                <div
                                    key={semana}
                                    id={`semana-${semana}`}
                                    className="scroll-mt-20 rounded-[20px] border border-brand-border bg-brand-card p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-brand-ink-strong">
                                            {semana === SIN_SEMANA
                                                ? 'General'
                                                : `Semana ${semana}`}
                                        </h3>
                                        {can.manage && (
                                            <SecondaryButton
                                                onClick={() => {
                                                    setAddingTo(semana);
                                                    setAddModalOpen(true);
                                                }}
                                            >
                                                Agregar recurso
                                            </SecondaryButton>
                                        )}
                                    </div>
                                    <ul className="mt-4 space-y-4">
                                        {items.map((recurso) => (
                                            <RecursoItem
                                                key={recurso.id}
                                                recurso={recurso}
                                                canManage={can.manage}
                                                onDelete={deleteRecurso}
                                                anchorId={`recurso-${recurso.id}`}
                                            />
                                        ))}
                                        {evaluacionesSemana.map((evaluacion) => (
                                            <EvaluacionItem
                                                key={`evaluacion-${evaluacion.id}`}
                                                evaluacion={evaluacion}
                                                isStudent={isStudent}
                                                canManage={can.manage}
                                            />
                                        ))}
                                        {items.length === 0 &&
                                            evaluacionesSemana.length === 0 && (
                                                <li className="py-2 text-sm text-brand-muted">
                                                    Sin recursos para esta
                                                    semana.
                                                </li>
                                            )}
                                    </ul>
                                </div>
                                );
                            })}
                        </div>

                        <div className="w-full space-y-6 lg:w-72 lg:shrink-0">
                            {isStudent && (
                                <AlertasPanel recursos={recursos} />
                            )}
                            <NavegacionSemanas porSemana={porSemana} />
                        </div>
                    </div>
                </div>
            </div>

            {can.manage && (
                <Modal
                    show={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                >
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Nuevo recurso
                            {addingTo !== null &&
                                addingTo !== SIN_SEMANA &&
                                ` — Semana ${addingTo}`}
                        </h2>
                        <RecursoForm
                            key={addingTo ?? 'closed'}
                            course={course}
                            defaultSemana={
                                addingTo !== null && addingTo !== SIN_SEMANA
                                    ? addingTo
                                    : null
                            }
                            onDone={() => setAddModalOpen(false)}
                        />
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
