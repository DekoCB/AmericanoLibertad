import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    BeakerIcon,
    DocumentTextIcon,
    FlagIcon,
    LinkIcon,
    PencilIcon,
    PhotoIcon,
    QuestionMarkCircleIcon,
    RectangleStackIcon,
    TrashIcon,
    VideoCameraIcon,
} from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useRef, useState } from 'react';
import {
    Course,
    EntregaEvaluacion,
    Evaluation,
    evaluationTypeLabels,
    ForoTema,
    RecursoAula,
    recursoTipoLabels,
    SemanaContenido,
} from '@/types/models';
import { formatDate, formatDateTime } from '@/utils/date';
import SemanaPanel from './SemanaPanel';

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

const evaluacionIcon: Record<Evaluation['type'], typeof AcademicCapIcon> = {
    exam: AcademicCapIcon,
    quiz: QuestionMarkCircleIcon,
    homework: DocumentTextIcon,
    project: BeakerIcon,
};

type TipoContenido =
    | 'anuncio'
    | 'video'
    | 'imagen'
    | 'presentacion'
    | 'pdf'
    | 'enlace'
    | 'archivo';

const contenidoIcon: Record<TipoContenido, typeof AcademicCapIcon> = {
    anuncio: FlagIcon,
    video: VideoCameraIcon,
    imagen: PhotoIcon,
    presentacion: RectangleStackIcon,
    pdf: DocumentTextIcon,
    enlace: LinkIcon,
    archivo: ArrowDownTrayIcon,
};

function inferirTipoContenido(recurso: RecursoAula): TipoContenido {
    if (recurso.tipo === 'anuncio') return 'anuncio';

    if (recurso.tipo === 'enlace') {
        const url = recurso.url?.toLowerCase() ?? '';
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
            return 'video';
        }
        return 'enlace';
    }

    const nombre = recurso.archivo_nombre?.toLowerCase() ?? '';
    if (/\.(mp4|mov|avi|webm|mkv)$/.test(nombre)) return 'video';
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(nombre)) return 'imagen';
    if (/\.(ppt|pptx|key|odp)$/.test(nombre)) return 'presentacion';
    if (/\.pdf$/.test(nombre)) return 'pdf';
    return 'archivo';
}

const TOTAL_SEMANAS = 20;

interface ResumenSemana {
    semana: number | 'general';
    total: number;
    pendiente: boolean;
}

interface AlertaRecurso {
    id: number;
    titulo: string;
    fecha_entrega: string;
    semana: number | null;
}

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
        es_principal: boolean;
        fecha_entrega: string;
        descripcion: string;
        url: string;
        archivo: File | null;
    }>({
        semana: defaultSemana ? String(defaultSemana) : '',
        titulo: '',
        tipo: 'anuncio',
        entregable: false,
        es_principal: false,
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
                    <div className="mt-1">
                        <SelectMenu
                            id="tipo"
                            value={data.tipo}
                            onChange={(value) => setData('tipo', value)}
                            options={Object.entries(recursoTipoLabels).map(
                                ([value, label]) => ({ value, label }),
                            )}
                        />
                    </div>
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
                {data.semana !== '' && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <input
                            id="es_principal"
                            type="checkbox"
                            checked={data.es_principal}
                            onChange={(e) =>
                                setData('es_principal', e.target.checked)
                            }
                            className="rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                        />
                        <label
                            htmlFor="es_principal"
                            className="text-sm font-medium text-brand-ink-strong"
                        >
                            Es el contenido principal de la semana (clase o
                            recurso central)
                        </label>
                    </div>
                )}
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

export function RecursoItem({
    recurso,
    canManage,
    onDelete,
    isStudent,
    onToggleVisto,
}: {
    recurso: RecursoAula;
    canManage: boolean;
    onDelete: (id: number) => void;
    isStudent?: boolean;
    onToggleVisto?: (id: number) => void;
}) {
    const Icono = contenidoIcon[inferirTipoContenido(recurso)];

    return (
        <li className="rounded-md border border-brand-border p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadge[recurso.tipo]}`}
                        >
                            <Icono className="size-3.5" />
                            {recursoTipoLabels[recurso.tipo]}
                        </span>
                        {recurso.es_principal && (
                            <span className="rounded-full bg-brand-navy px-2 py-0.5 text-xs font-medium text-white">
                                Contenido principal
                            </span>
                        )}
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
                    {isStudent && onToggleVisto && (
                        <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-navy">
                            <input
                                type="checkbox"
                                checked={recurso.visto ?? false}
                                onChange={() => onToggleVisto(recurso.id)}
                                className="rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                            />
                            {recurso.visto ? (
                                <span className="text-emerald-600">
                                    Material revisado
                                </span>
                            ) : (
                                'Marcar como revisado'
                            )}
                        </label>
                    )}
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

const estadoActividadBadge: Record<
    NonNullable<Evaluation['estado']>,
    string
> = {
    pendiente: 'bg-gray-100 text-gray-700',
    entregado: 'bg-sky-100 text-sky-800',
    calificado: 'bg-emerald-100 text-emerald-800',
    vencido: 'bg-red-100 text-red-800',
};

const estadoActividadLabel: Record<NonNullable<Evaluation['estado']>, string> = {
    pendiente: 'Pendiente',
    entregado: 'Entregado',
    calificado: 'Calificado',
    vencido: 'Vencido',
};

export function EvaluacionItem({
    evaluacion,
    isStudent,
    canManage,
}: {
    evaluacion: Evaluation;
    isStudent: boolean;
    canManage: boolean;
}) {
    const Icono = evaluacionIcon[evaluacion.type];

    return (
        <li className="rounded-md border border-brand-border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${evaluacionBadge[evaluacion.type]}`}
                >
                    <Icono className="size-3.5" />
                    Evaluación · {evaluationTypeLabels[evaluacion.type]}
                </span>
                {isStudent && evaluacion.estado && (
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoActividadBadge[evaluacion.estado]}`}
                    >
                        {estadoActividadLabel[evaluacion.estado]}
                    </span>
                )}
                <p className="font-medium text-brand-ink-strong">
                    {evaluacion.name}
                </p>
            </div>
            <p className="mt-1 text-sm text-brand-muted">
                {formatDate(evaluacion.date)} · Ponderación{' '}
                {evaluacion.weight}%
                {!isStudent && evaluacion.grades_count !== undefined && (
                    <>
                        {' '}
                        · Calificadas: {evaluacion.grades_count}/
                        {evaluacion.total_estudiantes ?? 0}
                    </>
                )}
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

function SemanasNav({
    course,
    resumenSemanas,
    semanaActual,
}: {
    course: Course;
    resumenSemanas: ResumenSemana[];
    semanaActual: number | null;
}) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-brand-ink-strong">
                Contenido de la sección
            </h3>
            <ul className="max-h-[70vh] divide-y divide-brand-border-faint overflow-y-auto rounded-[20px] border border-brand-border bg-brand-card">
                {resumenSemanas.map(({ semana, total, pendiente }) => {
                    const isActive =
                        semana === 'general'
                            ? semanaActual === null
                            : semanaActual === semana;

                    return (
                        <li key={semana}>
                            <Link
                                href={route('aula-virtual.show', {
                                    course: course.id,
                                    semana,
                                })}
                                preserveScroll
                                className={`flex items-center justify-between px-4 py-2.5 text-sm transition ${
                                    isActive
                                        ? 'bg-brand-navy font-semibold text-white'
                                        : 'text-brand-ink hover:bg-brand-hover'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {pendiente && (
                                        <span
                                            className="size-1.5 shrink-0 rounded-full bg-amber-400"
                                            title="Tienes actividades pendientes esta semana"
                                        />
                                    )}
                                    {semana === 'general'
                                        ? 'Bienvenida'
                                        : `Semana ${semana}`}
                                </span>
                                {total > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs ${
                                            isActive
                                                ? 'bg-white/20'
                                                : 'bg-brand-cream text-brand-muted'
                                        }`}
                                    >
                                        {total}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function AlertasPanel({ recursos }: { recursos: AlertaRecurso[] }) {
    const alertas = useMemo(
        () =>
            recursos
                .map((r) => ({
                    recurso: r,
                    dias: diasRestantes(r.fecha_entrega),
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

export function listaDesdeTexto(texto: string | null): string[] {
    if (!texto) return [];
    return texto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean);
}

function InfoSeccion({
    titulo,
    vacio,
    canManage,
    onEditar,
    children,
}: {
    titulo: string;
    vacio: boolean;
    canManage: boolean;
    onEditar: () => void;
    children: React.ReactNode;
}) {
    if (vacio && !canManage) return null;

    return (
        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-ink-strong">
                    {titulo}
                </h3>
                {canManage && (
                    <button
                        onClick={onEditar}
                        className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-navy"
                        title="Editar información del curso"
                    >
                        <PencilIcon className="size-4" />
                    </button>
                )}
            </div>
            {vacio ? (
                <p className="mt-3 text-sm text-brand-muted">
                    Aún no agregaste esta información.
                </p>
            ) : (
                <div className="mt-3">{children}</div>
            )}
        </div>
    );
}

function CourseInfoForm({
    course,
    onDone,
}: {
    course: Course;
    onDone: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        objetivo_general: course.objetivo_general ?? '',
        mensaje_bienvenida: course.mensaje_bienvenida ?? '',
        modalidad: course.modalidad ?? '',
        sistema_evaluacion: course.sistema_evaluacion ?? '',
        requisitos: course.requisitos ?? '',
        competencia_general: course.competencia_general ?? '',
        competencias_especificas: course.competencias_especificas ?? '',
        resultados_aprendizaje: course.resultados_aprendizaje ?? '',
        normas_curso: course.normas_curso ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('aula-virtual.info.update', course.id), {
            onSuccess: onDone,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <InputLabel
                    htmlFor="objetivo_general"
                    value="Objetivo general del curso"
                />
                <textarea
                    id="objetivo_general"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.objetivo_general}
                    onChange={(e) =>
                        setData('objetivo_general', e.target.value)
                    }
                />
                <InputError
                    message={errors.objetivo_general}
                    className="mt-1"
                />
            </div>

            <div>
                <InputLabel
                    htmlFor="mensaje_bienvenida"
                    value="Mensaje de bienvenida para los estudiantes"
                />
                <textarea
                    id="mensaje_bienvenida"
                    rows={3}
                    placeholder="Bienvenidos al curso. En este espacio encontrarás..."
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.mensaje_bienvenida}
                    onChange={(e) =>
                        setData('mensaje_bienvenida', e.target.value)
                    }
                />
                <InputError
                    message={errors.mensaje_bienvenida}
                    className="mt-1"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="modalidad" value="Modalidad" />
                    <TextInput
                        id="modalidad"
                        placeholder="Presencial, virtual, mixta..."
                        className="mt-1 block w-full"
                        value={data.modalidad}
                        onChange={(e) =>
                            setData('modalidad', e.target.value)
                        }
                    />
                    <InputError message={errors.modalidad} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor="sistema_evaluacion"
                        value="Sistema de evaluación"
                    />
                    <TextInput
                        id="sistema_evaluacion"
                        className="mt-1 block w-full"
                        value={data.sistema_evaluacion}
                        onChange={(e) =>
                            setData('sistema_evaluacion', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.sistema_evaluacion}
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="requisitos" value="Requisitos del curso" />
                <textarea
                    id="requisitos"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.requisitos}
                    onChange={(e) => setData('requisitos', e.target.value)}
                />
                <InputError message={errors.requisitos} className="mt-1" />
            </div>

            <div>
                <InputLabel
                    htmlFor="competencia_general"
                    value="Competencia general"
                />
                <textarea
                    id="competencia_general"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.competencia_general}
                    onChange={(e) =>
                        setData('competencia_general', e.target.value)
                    }
                />
                <InputError
                    message={errors.competencia_general}
                    className="mt-1"
                />
            </div>

            <div>
                <InputLabel
                    htmlFor="competencias_especificas"
                    value="Competencias específicas (una por línea)"
                />
                <textarea
                    id="competencias_especificas"
                    rows={3}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.competencias_especificas}
                    onChange={(e) =>
                        setData('competencias_especificas', e.target.value)
                    }
                />
                <InputError
                    message={errors.competencias_especificas}
                    className="mt-1"
                />
            </div>

            <div>
                <InputLabel
                    htmlFor="resultados_aprendizaje"
                    value="Resultados de aprendizaje esperados (uno por línea)"
                />
                <textarea
                    id="resultados_aprendizaje"
                    rows={3}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.resultados_aprendizaje}
                    onChange={(e) =>
                        setData('resultados_aprendizaje', e.target.value)
                    }
                />
                <InputError
                    message={errors.resultados_aprendizaje}
                    className="mt-1"
                />
            </div>

            <div>
                <InputLabel
                    htmlFor="normas_curso"
                    value="Normas del curso (una por línea)"
                />
                <textarea
                    id="normas_curso"
                    rows={3}
                    placeholder="Participación, entrega de actividades, puntualidad, integridad académica..."
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.normas_curso}
                    onChange={(e) => setData('normas_curso', e.target.value)}
                />
                <InputError message={errors.normas_curso} className="mt-1" />
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Guardar cambios
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

const GUIA_AULA_VIRTUAL = [
    'Revisar el contenido de cada semana.',
    'Revisar los materiales de aprendizaje.',
    'Visualizar las clases o recursos multimedia.',
    'Resolver las actividades.',
    'Entregar las tareas dentro del plazo establecido.',
    'Revisar las calificaciones y retroalimentación.',
];

function BienvenidaPanel({
    course,
    recursos,
    canManage,
    isStudent,
    onDeleteRecurso,
    onToggleVisto,
    onAddRecurso,
    semanaSiguiente,
}: {
    course: Course;
    recursos: RecursoAula[];
    canManage: boolean;
    isStudent: boolean;
    onDeleteRecurso: (id: number) => void;
    onToggleVisto: (id: number) => void;
    onAddRecurso: () => void;
    semanaSiguiente: number | 'general' | null;
}) {
    const [editing, setEditing] = useState(false);

    const competenciasEspecificas = listaDesdeTexto(
        course.competencias_especificas,
    );
    const resultadosAprendizaje = listaDesdeTexto(
        course.resultados_aprendizaje,
    );
    const normas = listaDesdeTexto(course.normas_curso);

    const infoGeneral = [
        course.schedule && { label: 'Horario', valor: course.schedule },
        course.modalidad && { label: 'Modalidad', valor: course.modalidad },
        { label: 'Duración', valor: `${TOTAL_SEMANAS} semanas` },
        course.sistema_evaluacion && {
            label: 'Sistema de evaluación',
            valor: course.sistema_evaluacion,
        },
        course.requisitos && {
            label: 'Requisitos', valor: course.requisitos,
        },
    ].filter(Boolean) as { label: string; valor: string }[];

    return (
        <div className="space-y-6">
            {/* 2.1 Presentación del curso */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            {course.subject?.name ?? course.name}
                        </h3>
                        <p className="text-sm text-brand-muted">
                            {course.name}
                            {course.subject?.ciclo &&
                                ` · Ciclo ${course.subject.ciclo}`}
                        </p>
                    </div>
                    {canManage && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex shrink-0 items-center gap-1 text-sm text-brand-muted hover:text-brand-navy"
                            title="Editar información del curso"
                        >
                            <PencilIcon className="size-4" />
                        </button>
                    )}
                </div>

                {course.subject?.description && (
                    <p className="mt-3 text-sm text-brand-ink">
                        {course.subject.description}
                    </p>
                )}

                {course.objetivo_general && (
                    <p className="mt-3 text-sm text-brand-ink">
                        <span className="font-medium text-brand-ink-strong">
                            Objetivo general:{' '}
                        </span>
                        {course.objetivo_general}
                    </p>
                )}

                <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-brand-border-faint pt-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Docente responsable
                        </dt>
                        <dd className="text-sm text-brand-ink-strong">
                            {course.teacher
                                ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                : 'Sin asignar'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Periodo académico
                        </dt>
                        <dd className="text-sm text-brand-ink-strong">
                            {course.period}
                        </dd>
                    </div>
                    {course.subject?.credit_hours != null && (
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                                Créditos
                            </dt>
                            <dd className="text-sm text-brand-ink-strong">
                                {course.subject.credit_hours}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* 2.2 Bienvenida del docente */}
            <InfoSeccion
                titulo="Bienvenida del docente"
                vacio={!course.mensaje_bienvenida}
                canManage={canManage}
                onEditar={() => setEditing(true)}
            >
                <p className="whitespace-pre-line text-sm italic text-brand-ink">
                    “{course.mensaje_bienvenida}”
                </p>
            </InfoSeccion>

            {/* 2.3 Información general */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Información general
                    </h3>
                    {canManage && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-navy"
                            title="Editar información del curso"
                        >
                            <PencilIcon className="size-4" />
                        </button>
                    )}
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {infoGeneral.map((item) => (
                        <div key={item.label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                                {item.label}
                            </dt>
                            <dd className="text-sm text-brand-ink-strong">
                                {item.valor}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* 2.4 Competencias y resultados de aprendizaje */}
            <InfoSeccion
                titulo="Competencias y resultados de aprendizaje"
                vacio={
                    !course.competencia_general &&
                    competenciasEspecificas.length === 0 &&
                    resultadosAprendizaje.length === 0
                }
                canManage={canManage}
                onEditar={() => setEditing(true)}
            >
                <div className="space-y-4">
                    {course.competencia_general && (
                        <div>
                            <p className="text-sm font-medium text-brand-ink-strong">
                                Competencia general
                            </p>
                            <p className="mt-1 text-sm text-brand-ink">
                                {course.competencia_general}
                            </p>
                        </div>
                    )}
                    {competenciasEspecificas.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-brand-ink-strong">
                                Competencias específicas
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-ink">
                                {competenciasEspecificas.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {resultadosAprendizaje.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-brand-ink-strong">
                                Resultados de aprendizaje esperados
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-ink">
                                {resultadosAprendizaje.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </InfoSeccion>

            {/* 2.5 ¿Cómo utilizar el aula virtual? */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <h3 className="text-lg font-bold text-brand-ink-strong">
                    ¿Cómo utilizar el aula virtual?
                </h3>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-brand-ink">
                    {GUIA_AULA_VIRTUAL.map((paso, i) => (
                        <li key={i}>{paso}</li>
                    ))}
                </ol>
            </div>

            {/* 2.6 Normas del curso */}
            <InfoSeccion
                titulo="Normas del curso"
                vacio={normas.length === 0}
                canManage={canManage}
                onEditar={() => setEditing(true)}
            >
                <ul className="list-disc space-y-1 pl-5 text-sm text-brand-ink">
                    {normas.map((norma, i) => (
                        <li key={i}>{norma}</li>
                    ))}
                </ul>
            </InfoSeccion>

            {/* 2.7 Documentos importantes */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Documentos importantes
                    </h3>
                    {canManage && (
                        <SecondaryButton onClick={onAddRecurso}>
                            Agregar recurso
                        </SecondaryButton>
                    )}
                </div>
                <p className="mt-1 text-sm text-brand-muted">
                    Sílabo, cronograma, reglamento, guía del estudiante y
                    otros documentos generales del curso.
                </p>
                <ul className="mt-4 space-y-4">
                    {recursos.map((recurso) => (
                        <RecursoItem
                            key={recurso.id}
                            recurso={recurso}
                            canManage={canManage}
                            onDelete={onDeleteRecurso}
                            isStudent={isStudent}
                            onToggleVisto={onToggleVisto}
                        />
                    ))}
                    {recursos.length === 0 && (
                        <li className="py-2 text-sm text-brand-muted">
                            Aún no se publicaron documentos generales para
                            este curso.
                        </li>
                    )}
                </ul>

                {semanaSiguiente !== null && (
                    <div className="mt-6 flex items-center justify-end border-t border-brand-border-faint pt-4">
                        <Link
                            href={route('aula-virtual.show', {
                                course: course.id,
                                semana: semanaSiguiente,
                            })}
                            preserveScroll
                            className="text-sm text-brand-link hover:underline"
                        >
                            Siguiente →
                        </Link>
                    </div>
                )}
            </div>

            {canManage && (
                <Modal show={editing} onClose={() => setEditing(false)}>
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Editar información del curso
                        </h2>
                        <CourseInfoForm
                            course={course}
                            onDone={() => setEditing(false)}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function Show({
    course,
    recursos,
    evaluaciones,
    contenidoSemana,
    foroTemas,
    progresoSemana,
    alertas,
    resumenSemanas,
    semanaActual,
    can,
    isStudent,
}: {
    course: Course;
    recursos: RecursoAula[];
    evaluaciones: Evaluation[];
    contenidoSemana: SemanaContenido | null;
    foroTemas: ForoTema[];
    progresoSemana: number | null;
    alertas: AlertaRecurso[];
    resumenSemanas: ResumenSemana[];
    semanaActual: number | null;
    can: { manage: boolean };
    isStudent: boolean;
}) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const { delete: destroy } = useForm();

    const deleteRecurso = (recursoId: number) => {
        if (!confirm('¿Eliminar este recurso?')) return;
        destroy(route('aula-virtual.destroy', [course.id, recursoId]));
    };

    const toggleVisto = (recursoId: number) => {
        router.post(
            route('aula-virtual.recursos.visto', recursoId),
            {},
            { preserveScroll: true },
        );
    };

    const tituloSemana =
        semanaActual === null ? 'Bienvenida' : `Semana ${semanaActual}`;

    const indice = semanaActual ?? 0;
    const semanaAnterior = indice > 1 ? indice - 1 : indice === 1 ? 'general' : null;
    const semanaSiguiente =
        semanaActual === null ? 1 : indice < TOTAL_SEMANAS ? indice + 1 : null;

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
            <Head title={`Aula virtual — ${course.name} — ${tituloSemana}`} />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="w-full space-y-6 lg:w-72 lg:shrink-0">
                            {isStudent && <AlertasPanel recursos={alertas} />}
                            <SemanasNav
                                course={course}
                                resumenSemanas={resumenSemanas}
                                semanaActual={semanaActual}
                            />
                        </div>

                        <div className="flex-1 space-y-6">
                            {semanaActual === null ? (
                                <BienvenidaPanel
                                    course={course}
                                    recursos={recursos}
                                    canManage={can.manage}
                                    isStudent={isStudent}
                                    onDeleteRecurso={deleteRecurso}
                                    onToggleVisto={toggleVisto}
                                    onAddRecurso={() => setAddModalOpen(true)}
                                    semanaSiguiente={semanaSiguiente}
                                />
                            ) : (
                                <SemanaPanel
                                    course={course}
                                    semana={semanaActual}
                                    contenidoSemana={contenidoSemana}
                                    recursos={recursos}
                                    evaluaciones={evaluaciones}
                                    foroTemas={foroTemas}
                                    progresoSemana={progresoSemana}
                                    canManage={can.manage}
                                    isStudent={isStudent}
                                    onDeleteRecurso={deleteRecurso}
                                    onToggleVisto={toggleVisto}
                                    onAddRecurso={() => setAddModalOpen(true)}
                                    semanaAnterior={semanaAnterior}
                                    semanaSiguiente={semanaSiguiente}
                                />
                            )}
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
                            Nuevo recurso — {tituloSemana}
                        </h2>
                        <RecursoForm
                            course={course}
                            defaultSemana={semanaActual}
                            onDone={() => setAddModalOpen(false)}
                        />
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
