import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import TextInput from '@/Components/TextInput';
import { CheckBadgeIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Evaluation, evaluationTypeLabels } from '@/types/models';

const tipoBadge: Record<Evaluation['type'], string> = {
    exam: 'bg-rose-100 text-rose-800',
    quiz: 'bg-amber-100 text-amber-800',
    homework: 'bg-sky-100 text-sky-800',
    project: 'bg-violet-100 text-violet-800',
};

export default function Index({
    evaluations,
    filters,
    isDocente,
}: {
    evaluations: Evaluation[];
    filters: { search?: string };
    isDocente: boolean;
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('grades.index'),
            { search },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CheckBadgeIcon />}>
                    {isDocente ? 'Mis notas' : 'Notas'}
                </PageTitle>
            }
        >
            <Head title="Notas" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <form onSubmit={submitSearch} className="max-w-sm">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por evaluación, curso o sección..."
                            className="w-full"
                        />
                    </form>

                    <div className="overflow-hidden overflow-x-auto rounded-[20px] border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Evaluación
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Curso — Sección
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
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadge[evaluation.type]}`}
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
                                            <div className="flex items-center gap-2">
                                                {evaluation.course?.subject
                                                    ?.name}{' '}
                                                —{' '}
                                                {evaluation.course?.name}
                                                {evaluation.course?.subject
                                                    ?.ciclo && (
                                                    <span className="whitespace-nowrap rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                        Ciclo{' '}
                                                        {
                                                            evaluation.course
                                                                .subject.ciclo
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            {!isDocente && (
                                                <div className="mt-0.5 text-xs text-brand-muted">
                                                    {evaluation.course?.teacher
                                                        ? `${evaluation.course.teacher.first_name} ${evaluation.course.teacher.last_name}`
                                                        : 'Sin docente'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {new Date(
                                                evaluation.date,
                                            ).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {evaluation.grades_count ?? 0} /{' '}
                                            {evaluation.total_estudiantes ??
                                                0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <Link
                                                href={route(
                                                    'evaluations.grades.edit',
                                                    evaluation.id,
                                                )}
                                                className="text-brand-link hover:underline"
                                            >
                                                Calificar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {evaluations.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron evaluaciones.
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
