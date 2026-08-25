import { Evaluation, evaluationTypeLabels } from '@/types/models';
import { formatDate } from '@/utils/date';
import { Link } from '@inertiajs/react';

const EVALUATION_BADGE: Record<
    Evaluation['type'],
    { bg: string; text: string }
> = {
    homework: { bg: 'oklch(93% 0.05 85)', text: 'oklch(45% 0.09 85)' },
    exam: { bg: 'oklch(93% 0.05 350)', text: 'oklch(42% 0.1 350)' },
    project: { bg: 'oklch(93% 0.05 240)', text: 'oklch(42% 0.1 240)' },
    quiz: { bg: 'oklch(93% 0.05 155)', text: 'oklch(42% 0.1 155)' },
    comportamiento: { bg: 'oklch(93% 0.05 60)', text: 'oklch(42% 0.1 60)' },
};

export default function UpcomingEvaluationsCard({
    evaluations,
    title = 'Próximas evaluaciones',
}: {
    evaluations: Evaluation[];
    title?: string;
}) {
    return (
        <div
            className="rounded-lg border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                {title}
            </h3>
            <div className="flex flex-col">
                {evaluations.map((evaluation) => {
                    const badge = EVALUATION_BADGE[evaluation.type];

                    return (
                        <div
                            key={evaluation.id}
                            className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0"
                            style={{ borderColor: 'var(--brand-border-faint)' }}
                        >
                            <div>
                                <Link
                                    href={route(
                                        'courses.show',
                                        evaluation.course_id,
                                    )}
                                    className="text-sm font-medium hover:underline"
                                    style={{ color: 'var(--brand-ink-strong)' }}
                                >
                                    {evaluation.name} —{' '}
                                    {evaluation.course?.subject?.name}
                                </Link>
                                <div
                                    className="text-[13px]"
                                    style={{ color: 'var(--brand-muted-soft)' }}
                                >
                                    {evaluationTypeLabels[evaluation.type]} ·{' '}
                                    {formatDate(evaluation.date)}
                                </div>
                            </div>
                            <span
                                className="whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold"
                                style={{
                                    background: badge.bg,
                                    color: badge.text,
                                }}
                            >
                                {evaluationTypeLabels[evaluation.type]}
                            </span>
                        </div>
                    );
                })}
                {evaluations.length === 0 && (
                    <div
                        className="py-4 text-sm"
                        style={{ color: 'var(--brand-muted-soft)' }}
                    >
                        No hay evaluaciones próximas.
                    </div>
                )}
            </div>
        </div>
    );
}
