import CalificarModal from '@/Components/CalificarModal';
import { Course, Evaluation, Grade, Libreta, evaluationTypeLabels } from '@/types/models';
import { formatDate } from '@/utils/date';
import { useState } from 'react';
import LibretaNotas from './LibretaNotas';

const tipoBadge: Record<Evaluation['type'], string> = {
    exam: 'bg-rose-100 text-rose-800',
    quiz: 'bg-amber-100 text-amber-800',
    homework: 'bg-sky-100 text-sky-800',
    project: 'bg-violet-100 text-violet-800',
    comportamiento: 'bg-fuchsia-100 text-fuchsia-800',
};

export type EvaluacionConMiNota = Evaluation & { mi_grade: Grade | null };

function TablaEvaluaciones({ evaluaciones }: { evaluaciones: Evaluation[] }) {
    return (
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
            <table className="min-w-full divide-y divide-brand-border-faint">
                <thead className="bg-brand-thead">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Evaluación
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Calificadas
                        </th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-faint">
                    {evaluaciones.map((evaluacion) => (
                        <tr key={evaluacion.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-lg px-2 py-0.5 text-xs font-medium ${tipoBadge[evaluacion.type]}`}
                                    >
                                        {evaluationTypeLabels[evaluacion.type]}
                                    </span>
                                    <span className="font-medium text-brand-ink-strong">
                                        {evaluacion.name}
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                {formatDate(evaluacion.date)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                {evaluacion.grades_count ?? 0} /{' '}
                                {evaluacion.total_estudiantes ?? 0}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                <CalificarModal evaluationId={evaluacion.id}>
                                    {(open) => (
                                        <button
                                            type="button"
                                            onClick={open}
                                            className="text-brand-link hover:underline"
                                        >
                                            Calificar
                                        </button>
                                    )}
                                </CalificarModal>
                            </td>
                        </tr>
                    ))}
                    {evaluaciones.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-sm text-brand-muted"
                            >
                                No hay evaluaciones registradas para esta
                                sección.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function MisNotas({ misNotas }: { misNotas: EvaluacionConMiNota[] }) {
    return (
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
            <table className="min-w-full divide-y divide-brand-border-faint">
                <thead className="bg-brand-thead">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Evaluación
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Nota
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Comentario
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-faint">
                    {misNotas.map((evaluacion) => (
                        <tr key={evaluacion.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-lg px-2 py-0.5 text-xs font-medium ${tipoBadge[evaluacion.type]}`}
                                    >
                                        {evaluationTypeLabels[evaluacion.type]}
                                    </span>
                                    <span className="font-medium text-brand-ink-strong">
                                        {evaluacion.name}
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                {formatDate(evaluacion.date)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                {evaluacion.mi_grade
                                    ? `${evaluacion.mi_grade.score} / ${evaluacion.max_score}`
                                    : 'Sin calificar'}
                            </td>
                            <td className="px-4 py-3 text-sm text-brand-muted">
                                {evaluacion.mi_grade?.comments ?? '—'}
                            </td>
                        </tr>
                    ))}
                    {misNotas.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-sm text-brand-muted"
                            >
                                No hay evaluaciones registradas para esta
                                sección.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

type VistaNotas = 'evaluacion' | 'libreta';

function SelectorVista({
    vista,
    setVista,
}: {
    vista: VistaNotas;
    setVista: (vista: VistaNotas) => void;
}) {
    const opciones: { value: VistaNotas; label: string }[] = [
        { value: 'evaluacion', label: 'Vista por evaluación' },
        { value: 'libreta', label: 'Libreta de notas' },
    ];

    return (
        <div className="flex gap-2">
            {opciones.map((opcion) => {
                const activo = opcion.value === vista;
                return (
                    <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setVista(opcion.value)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                        style={{
                            background: activo
                                ? 'var(--brand-navy)'
                                : 'var(--brand-hover)',
                            color: activo ? '#fff' : 'var(--brand-muted)',
                        }}
                    >
                        {opcion.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function NotasPanel({
    course,
    evaluacionesCurso,
    misNotas,
    libreta,
    canManage,
    canManageEstructura,
    bloqueoPorMora,
}: {
    course: Course;
    evaluacionesCurso: Evaluation[] | null;
    misNotas: EvaluacionConMiNota[] | null;
    libreta: Libreta | null;
    canManage: boolean;
    canManageEstructura: boolean;
    bloqueoPorMora?: { motivo: string | null } | null;
}) {
    const [vista, setVista] = useState<VistaNotas>('evaluacion');

    if (canManage && evaluacionesCurso) {
        return (
            <div className="space-y-4">
                <SelectorVista vista={vista} setVista={setVista} />
                {vista === 'evaluacion' ? (
                    <TablaEvaluaciones evaluaciones={evaluacionesCurso} />
                ) : libreta ? (
                    <LibretaNotas
                        course={course}
                        libreta={libreta}
                        canGrade={canManage}
                        canManageEstructura={canManageEstructura}
                    />
                ) : null}
            </div>
        );
    }

    if (bloqueoPorMora) {
        return (
            <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-center">
                <p className="font-bold text-red-900">
                    Acceso a notas restringido
                </p>
                <p className="mt-1 text-sm text-red-800">
                    Tienes cuotas vencidas sin pagar
                    {bloqueoPorMora.motivo
                        ? ` (${bloqueoPorMora.motivo})`
                        : ''}
                    . Regulariza tu situación de pagos para volver a ver tus
                    notas.
                </p>
            </div>
        );
    }

    if (misNotas) {
        return <MisNotas misNotas={misNotas} />;
    }

    return null;
}
