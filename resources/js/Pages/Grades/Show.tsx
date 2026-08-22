import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CalificarModal from '@/Components/CalificarModal';
import { Head, Link } from '@inertiajs/react';
import { Course, Evaluation, evaluationTypeLabels } from '@/types/models';
import { formatDate } from '@/utils/date';

const tipoBadge: Record<Evaluation['type'], string> = {
    exam: 'bg-rose-100 text-rose-800',
    quiz: 'bg-amber-100 text-amber-800',
    homework: 'bg-sky-100 text-sky-800',
    project: 'bg-violet-100 text-violet-800',
};

export default function Show({
    course,
    evaluations,
}: {
    course: Course;
    evaluations: Evaluation[];
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Notas — {course.subject?.name} · {course.name}
                    </h2>
                    <Link
                        href={route('grades.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Notas — ${course.name}`} />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-brand-muted">
                        {course.subject?.carrera && (
                            <span>{course.subject.carrera.name}</span>
                        )}
                        {course.subject?.ciclo && (
                            <span className="rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                Ciclo {course.subject.ciclo}
                            </span>
                        )}
                        {course.teacher && (
                            <span>
                                {course.teacher.first_name}{' '}
                                {course.teacher.last_name}
                            </span>
                        )}
                    </div>

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
                                {evaluations.map((evaluation) => (
                                    <tr key={evaluation.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${tipoBadge[evaluation.type]}`}
                                                >
                                                    {
                                                        evaluationTypeLabels[
                                                            evaluation.type
                                                        ]
                                                    }
                                                </span>
                                                <span className="font-medium text-brand-ink-strong">
                                                    {evaluation.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(evaluation.date)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {evaluation.grades_count ?? 0} /{' '}
                                            {evaluation.total_estudiantes ??
                                                0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <CalificarModal
                                                evaluationId={evaluation.id}
                                            >
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
                                {evaluations.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No hay evaluaciones registradas
                                            para esta sección.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
