import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Evaluation, evaluationTypeLabels } from '@/types/models';

export type GradeRow = {
    student_id: number;
    first_name: string;
    last_name: string;
    score: number | null;
    comments: string | null;
    entrega_nombre: string | null;
    entrega_url: string | null;
};

export default function Form({
    evaluation,
    students,
    onDone,
}: {
    evaluation: Evaluation;
    students: GradeRow[];
    onDone: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        grades: students.map((student) => ({
            student_id: student.student_id,
            score: student.score,
            comments: student.comments ?? '',
        })),
    });

    const updateGrade = (
        index: number,
        field: 'score' | 'comments',
        value: string,
    ) => {
        const grades = [...data.grades];
        grades[index] = {
            ...grades[index],
            [field]:
                field === 'score'
                    ? value === ''
                        ? null
                        : Math.round(Number(value))
                    : value,
        };
        setData('grades', grades);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('evaluations.grades.update', evaluation.id), { onSuccess: onDone });
    };

    return (
        <div className="max-h-[70vh] overflow-y-auto">
            <div className="mb-4 text-sm text-brand-muted">
                {evaluationTypeLabels[evaluation.type]} · Puntaje máximo:{' '}
                {evaluation.max_score} · Ponderación: {evaluation.weight}%
            </div>

            <form onSubmit={submit} className="space-y-6">
                <table className="min-w-full divide-y divide-brand-border-faint">
                    <thead>
                        <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium uppercase text-brand-muted">
                                Estudiante
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-medium uppercase text-brand-muted">
                                Nota
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-medium uppercase text-brand-muted">
                                Comentarios
                            </th>
                            {(evaluation.type === 'homework' ||
                                evaluation.type === 'project') && (
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase text-brand-muted">
                                    Entrega
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-faint">
                        {students.map((student, index) => (
                            <tr key={student.student_id}>
                                <td className="whitespace-nowrap px-2 py-2 text-sm text-brand-ink-strong">
                                    {student.first_name} {student.last_name}
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={evaluation.max_score}
                                        step={1}
                                        className="block w-24 rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                        value={data.grades[index]?.score ?? ''}
                                        onChange={(e) =>
                                            updateGrade(
                                                index,
                                                'score',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            (errors as Record<string, string>)[
                                                `grades.${index}.score`
                                            ]
                                        }
                                        className="mt-1"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="text"
                                        className="block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                        value={data.grades[index]?.comments ?? ''}
                                        onChange={(e) =>
                                            updateGrade(
                                                index,
                                                'comments',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </td>
                                {(evaluation.type === 'homework' ||
                                    evaluation.type === 'project') && (
                                    <td className="whitespace-nowrap px-2 py-2 text-sm">
                                        {student.entrega_url ? (
                                            <a
                                                href={student.entrega_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-brand-link hover:underline"
                                            >
                                                {student.entrega_nombre}
                                            </a>
                                        ) : (
                                            <span className="text-brand-muted">
                                                Sin entrega
                                            </span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td
                                    colSpan={
                                        evaluation.type === 'homework' ||
                                        evaluation.type === 'project'
                                            ? 4
                                            : 3
                                    }
                                    className="px-2 py-6 text-center text-sm text-brand-muted"
                                >
                                    No hay estudiantes matriculados activos en
                                    esta sección.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        Guardar calificaciones
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={onDone}>
                        Cancelar
                    </SecondaryButton>
                </div>
            </form>
        </div>
    );
}
