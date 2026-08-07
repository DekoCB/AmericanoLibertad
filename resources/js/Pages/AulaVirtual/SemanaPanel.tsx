import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { PencilIcon, PlusIcon, TrashIcon } from '@/Components/Icons';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Course,
    Evaluation,
    ForoTema,
    RecursoAula,
    SemanaContenido,
    Tema,
} from '@/types/models';
import { EvaluacionItem, listaDesdeTexto, RecursoItem } from './Show';
import ForoPanel from './ForoPanel';
import EvaluationForm from '../Evaluations/Form';
import { formatDate } from '@/utils/date';

interface TemaFormItem {
    titulo: string;
    subtemasTexto: string;
}

function temasAFormulario(temas: Tema[] | null): TemaFormItem[] {
    if (!temas || temas.length === 0) return [];
    return temas.map((tema) => ({
        titulo: tema.titulo,
        subtemasTexto: tema.subtemas.join('\n'),
    }));
}

function SeccionSemana({
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
                        title="Editar contenido de la semana"
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

function SemanaContenidoForm({
    course,
    semana,
    contenidoSemana,
    onDone,
}: {
    course: Course;
    semana: number;
    contenidoSemana: SemanaContenido | null;
    onDone: () => void;
}) {
    const [temas, setTemas] = useState<TemaFormItem[]>(
        temasAFormulario(contenidoSemana?.temas ?? null),
    );

    const { data, setData, patch, processing, errors, transform } = useForm({
        titulo: contenidoSemana?.titulo ?? '',
        descripcion: contenidoSemana?.descripcion ?? '',
        objetivo: contenidoSemana?.objetivo ?? '',
        resultados_aprendizaje: contenidoSemana?.resultados_aprendizaje ?? '',
        cierre_resumen: contenidoSemana?.cierre_resumen ?? '',
    });

    const agregarTema = () => {
        setTemas((prev) => [...prev, { titulo: '', subtemasTexto: '' }]);
    };

    const quitarTema = (index: number) => {
        setTemas((prev) => prev.filter((_, i) => i !== index));
    };

    const actualizarTema = (
        index: number,
        campo: keyof TemaFormItem,
        valor: string,
    ) => {
        setTemas((prev) =>
            prev.map((tema, i) =>
                i === index ? { ...tema, [campo]: valor } : tema,
            ),
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        transform((formData) => ({
            ...formData,
            temas: temas
                .filter((tema) => tema.titulo.trim() !== '')
                .map((tema) => ({
                    titulo: tema.titulo.trim(),
                    subtemas: tema.subtemasTexto
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                })),
        }));

        patch(route('aula-virtual.contenido.update', [course.id, semana]), {
            onSuccess: onDone,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <InputLabel htmlFor="titulo" value="Título de la semana" />
                <TextInput
                    id="titulo"
                    placeholder="Introducción al curso"
                    className="mt-1 block w-full"
                    value={data.titulo}
                    onChange={(e) => setData('titulo', e.target.value)}
                />
                <InputError message={errors.titulo} className="mt-1" />
            </div>

            <div>
                <InputLabel htmlFor="descripcion" value="Descripción breve" />
                <textarea
                    id="descripcion"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.descripcion}
                    onChange={(e) => setData('descripcion', e.target.value)}
                />
                <InputError message={errors.descripcion} className="mt-1" />
            </div>

            <div>
                <InputLabel htmlFor="objetivo" value="Objetivo de la semana" />
                <textarea
                    id="objetivo"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.objetivo}
                    onChange={(e) => setData('objetivo', e.target.value)}
                />
                <InputError message={errors.objetivo} className="mt-1" />
            </div>

            <div>
                <InputLabel
                    htmlFor="resultados_aprendizaje"
                    value="Resultados de aprendizaje (uno por línea)"
                />
                <textarea
                    id="resultados_aprendizaje"
                    rows={3}
                    placeholder="Identificar los conceptos fundamentales."
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
                <InputLabel value="Contenido de aprendizaje (temas y subtemas)" />
                <div className="mt-1 space-y-3">
                    {temas.map((tema, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-brand-border p-3"
                        >
                            <div className="flex items-center gap-2">
                                <TextInput
                                    className="block w-full"
                                    placeholder={`Tema ${index + 1}`}
                                    value={tema.titulo}
                                    onChange={(e) =>
                                        actualizarTema(
                                            index,
                                            'titulo',
                                            e.target.value,
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => quitarTema(index)}
                                    className="shrink-0 text-red-600 hover:opacity-70"
                                    title="Eliminar tema"
                                    aria-label="Eliminar tema"
                                >
                                    <TrashIcon className="size-4" />
                                </button>
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Subtemas, uno por línea"
                                className="mt-2 block w-full rounded-xl border-brand-border bg-brand-card text-sm shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                value={tema.subtemasTexto}
                                onChange={(e) =>
                                    actualizarTema(
                                        index,
                                        'subtemasTexto',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    ))}
                    <SecondaryButton type="button" onClick={agregarTema}>
                        <PlusIcon className="mr-1 size-4" />
                        Agregar tema
                    </SecondaryButton>
                </div>
            </div>

            <div>
                <InputLabel
                    htmlFor="cierre_resumen"
                    value="Cierre de la semana: principales aprendizajes (uno por línea)"
                />
                <textarea
                    id="cierre_resumen"
                    rows={3}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.cierre_resumen}
                    onChange={(e) =>
                        setData('cierre_resumen', e.target.value)
                    }
                />
                <InputError message={errors.cierre_resumen} className="mt-1" />
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

function ChecklistSemana({
    recursos,
    evaluaciones,
}: {
    recursos: RecursoAula[];
    evaluaciones: Evaluation[];
}) {
    const items: { label: string; hecho: boolean }[] = [];

    if (recursos.length > 0) {
        items.push({
            label: 'Material revisado',
            hecho: recursos.every((r) => r.visto),
        });
    }

    if (evaluaciones.length > 0) {
        items.push({
            label: 'Actividad entregada',
            hecho: evaluaciones.every(
                (e) => e.estado === 'entregado' || e.estado === 'calificado',
            ),
        });

        const pendiente = evaluaciones.some(
            (e) => e.estado === 'pendiente' || e.estado === 'vencido',
        );
        items.push({
            label: pendiente ? 'Evaluación pendiente' : 'Evaluación al día',
            hecho: !pendiente,
        });
    }

    if (items.length === 0) return null;

    return (
        <ul className="mt-3 space-y-1">
            {items.map((item) => (
                <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                >
                    <span
                        className={
                            item.hecho
                                ? 'font-bold text-emerald-600'
                                : 'text-brand-muted'
                        }
                    >
                        {item.hecho ? '✓' : '○'}
                    </span>
                    <span
                        className={
                            item.hecho
                                ? 'text-brand-ink'
                                : 'text-brand-muted'
                        }
                    >
                        {item.label}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function RecordatorioEntregas({
    recursos,
    evaluaciones,
}: {
    recursos: RecursoAula[];
    evaluaciones: Evaluation[];
}) {
    const recordatorios = [
        ...recursos
            .filter((r) => r.entregable && r.fecha_entrega)
            .map((r) => ({
                titulo: r.titulo,
                fecha: r.fecha_entrega as string,
            })),
        ...evaluaciones
            .filter((e) =>
                ['pendiente', 'vencido', 'en_progreso'].includes(
                    e.estado ?? '',
                ),
            )
            .map((e) => ({ titulo: e.name, fecha: e.date })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (recordatorios.length === 0) return null;

    return (
        <div className="mt-4 border-t border-brand-border-faint pt-4">
            <p className="text-sm font-medium text-brand-ink-strong">
                Recordatorio de entregas
            </p>
            <ul className="mt-2 space-y-1">
                {recordatorios.map((item, i) => (
                    <li
                        key={i}
                        className="flex items-center justify-between text-sm text-brand-ink"
                    >
                        <span>{item.titulo}</span>
                        <span className="text-brand-muted">
                            {formatDate(item.fecha)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ProgresoBar({ progreso }: { progreso: number }) {
    return (
        <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-brand-muted">
                <span>Progreso de la semana</span>
                <span>{progreso}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brand-hover">
                <div
                    className="h-full rounded-full bg-brand-navy transition-all"
                    style={{ width: `${progreso}%` }}
                />
            </div>
        </div>
    );
}

export default function SemanaPanel({
    course,
    semana,
    contenidoSemana,
    recursos,
    evaluaciones,
    foroTemas,
    progresoSemana,
    canManage,
    canManageEvaluations,
    isStudent,
    onDeleteRecurso,
    onToggleVisto,
    onAddRecurso,
    semanaAnterior,
    semanaSiguiente,
}: {
    course: Course;
    semana: number;
    contenidoSemana: SemanaContenido | null;
    recursos: RecursoAula[];
    evaluaciones: Evaluation[];
    foroTemas: ForoTema[];
    progresoSemana: number | null;
    canManage: boolean;
    canManageEvaluations: boolean;
    isStudent: boolean;
    onDeleteRecurso: (id: number) => void;
    onToggleVisto: (id: number) => void;
    onAddRecurso: () => void;
    semanaAnterior: number | 'general' | null;
    semanaSiguiente: number | 'general' | null;
}) {
    const [editing, setEditing] = useState(false);
    const [creatingEvaluation, setCreatingEvaluation] = useState(false);

    const resultados = listaDesdeTexto(
        contenidoSemana?.resultados_aprendizaje ?? null,
    );
    const cierre = listaDesdeTexto(contenidoSemana?.cierre_resumen ?? null);
    const temas = contenidoSemana?.temas ?? [];

    const recursoPrincipal = recursos.find((r) => r.es_principal);
    const materiales = recursos.filter(
        (r) => !r.es_principal && !r.es_complementario,
    );
    const complementarios = recursos.filter(
        (r) => !r.es_principal && r.es_complementario,
    );

    return (
        <div className="space-y-6">
            {/* 3.1 Encabezado de la semana */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                            Semana {semana}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-brand-ink-strong">
                            {contenidoSemana?.titulo || `Semana ${semana}`}
                        </h3>
                    </div>
                    {canManage && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex shrink-0 items-center gap-1 text-sm text-brand-muted hover:text-brand-navy"
                            title="Editar contenido de la semana"
                        >
                            <PencilIcon className="size-4" />
                        </button>
                    )}
                </div>
                {contenidoSemana?.descripcion && (
                    <p className="mt-3 text-sm text-brand-ink">
                        {contenidoSemana.descripcion}
                    </p>
                )}
                {contenidoSemana?.objetivo && (
                    <p className="mt-2 text-sm text-brand-ink">
                        <span className="font-medium text-brand-ink-strong">
                            Objetivo:{' '}
                        </span>
                        {contenidoSemana.objetivo}
                    </p>
                )}
                {isStudent && (
                    <>
                        <ChecklistSemana
                            recursos={recursos}
                            evaluaciones={evaluaciones}
                        />
                        {progresoSemana !== null && (
                            <ProgresoBar progreso={progresoSemana} />
                        )}
                    </>
                )}
            </div>

            {/* 3.2 Resultados de aprendizaje */}
            <SeccionSemana
                titulo="Resultados de aprendizaje"
                vacio={resultados.length === 0}
                canManage={canManage}
                onEditar={() => setEditing(true)}
            >
                <p className="mb-2 text-sm text-brand-muted">
                    Al finalizar esta semana, el estudiante será capaz de:
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-brand-ink">
                    {resultados.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </SeccionSemana>

            {/* 3.3 Contenido de aprendizaje */}
            <SeccionSemana
                titulo="Contenido de aprendizaje"
                vacio={temas.length === 0}
                canManage={canManage}
                onEditar={() => setEditing(true)}
            >
                <div className="space-y-4">
                    {temas.map((tema, i) => (
                        <div key={i}>
                            <p className="text-sm font-medium text-brand-ink-strong">
                                Tema {i + 1}: {tema.titulo}
                            </p>
                            {tema.subtemas.length > 0 && (
                                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-ink">
                                    {tema.subtemas.map((subtema, j) => (
                                        <li key={j}>{subtema}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </SeccionSemana>

            {/* 3.5 Clase / contenido principal */}
            {recursoPrincipal && (
                <div className="rounded-[20px] border-2 border-brand-navy bg-brand-card p-6">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Clase de la semana
                    </h3>
                    <ul className="mt-3">
                        <RecursoItem
                            recurso={recursoPrincipal}
                            canManage={canManage}
                            onDelete={onDeleteRecurso}
                            isStudent={isStudent}
                            onToggleVisto={onToggleVisto}
                        />
                    </ul>
                </div>
            )}

            {/* 3.4 + 3.9 Materiales de aprendizaje y recursos complementarios */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Materiales de la semana
                    </h3>
                    {canManage && (
                        <SecondaryButton onClick={onAddRecurso}>
                            Agregar recurso
                        </SecondaryButton>
                    )}
                </div>
                <ul className="mt-4 space-y-4">
                    {materiales.map((recurso) => (
                        <RecursoItem
                            key={recurso.id}
                            recurso={recurso}
                            canManage={canManage}
                            onDelete={onDeleteRecurso}
                            isStudent={isStudent}
                            onToggleVisto={onToggleVisto}
                        />
                    ))}
                    {materiales.length === 0 && (
                        <li className="py-2 text-sm text-brand-muted">
                            Aún no se publicaron materiales para esta semana.
                        </li>
                    )}
                </ul>
            </div>

            {/* 3.9 Recursos complementarios */}
            {(complementarios.length > 0 || canManage) && (
                <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            Recursos complementarios
                        </h3>
                        {canManage && (
                            <SecondaryButton onClick={onAddRecurso}>
                                Agregar recurso
                            </SecondaryButton>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">
                        Lecturas adicionales, videos recomendados, enlaces y
                        ejercicios opcionales.
                    </p>
                    <ul className="mt-4 space-y-4">
                        {complementarios.map((recurso) => (
                            <RecursoItem
                                key={recurso.id}
                                recurso={recurso}
                                canManage={canManage}
                                onDelete={onDeleteRecurso}
                                isStudent={isStudent}
                                onToggleVisto={onToggleVisto}
                            />
                        ))}
                        {complementarios.length === 0 && (
                            <li className="py-2 text-sm text-brand-muted">
                                Aún no se publicaron recursos complementarios
                                para esta semana.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* 3.6 + 3.7 Actividades de la semana */}
            {(evaluaciones.length > 0 || canManage) && (
                <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            Actividades de la semana
                        </h3>
                        {canManageEvaluations && (
                            <SecondaryButton
                                onClick={() => setCreatingEvaluation(true)}
                            >
                                Nueva evaluación
                            </SecondaryButton>
                        )}
                    </div>
                    <ul className="mt-4 space-y-4">
                        {evaluaciones.map((evaluacion) => (
                            <EvaluacionItem
                                key={`evaluacion-${evaluacion.id}`}
                                evaluacion={evaluacion}
                                isStudent={isStudent}
                                canManage={canManage}
                            />
                        ))}
                        {evaluaciones.length === 0 && (
                            <li className="py-2 text-sm text-brand-muted">
                                Sin actividades registradas para esta semana.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* 3.8 Foro / participación */}
            <ForoPanel
                course={course}
                semana={semana}
                foroTemas={foroTemas}
                canManage={canManage}
            />

            {/* 3.10 Cierre de la semana */}
            <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Cierre de la semana
                    </h3>
                    {canManage && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-navy"
                            title="Editar contenido de la semana"
                        >
                            <PencilIcon className="size-4" />
                        </button>
                    )}
                </div>
                {cierre.length > 0 ? (
                    <>
                        <p className="mt-3 text-sm text-brand-muted">
                            Al finalizar esta semana debes haber aprendido:
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-ink">
                            {cierre.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </>
                ) : (
                    canManage && (
                        <p className="mt-3 text-sm text-brand-muted">
                            Aún no agregaste un resumen de cierre.
                        </p>
                    )
                )}

                {isStudent && (
                    <RecordatorioEntregas
                        recursos={recursos}
                        evaluaciones={evaluaciones}
                    />
                )}

                <div className="mt-6 flex items-center justify-between border-t border-brand-border-faint pt-4">
                    {semanaAnterior !== null ? (
                        <Link
                            href={route('aula-virtual.show', {
                                course: course.id,
                                semana: semanaAnterior,
                            })}
                            preserveScroll
                            className="text-sm text-brand-link hover:underline"
                        >
                            ← Anterior
                        </Link>
                    ) : (
                        <span />
                    )}
                    {semanaSiguiente !== null && (
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
                    )}
                </div>
            </div>

            {canManage && (
                <Modal show={editing} onClose={() => setEditing(false)}>
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Editar Semana {semana}
                        </h2>
                        <SemanaContenidoForm
                            course={course}
                            semana={semana}
                            contenidoSemana={contenidoSemana}
                            onDone={() => setEditing(false)}
                        />
                    </div>
                </Modal>
            )}

            {canManageEvaluations && (
                <Modal
                    show={creatingEvaluation}
                    onClose={() => setCreatingEvaluation(false)}
                >
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Nueva evaluación — Semana {semana}
                        </h2>
                        <EvaluationForm
                            course={course}
                            defaultSemana={semana}
                            onSuccess={() => setCreatingEvaluation(false)}
                            onCancel={() => setCreatingEvaluation(false)}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
