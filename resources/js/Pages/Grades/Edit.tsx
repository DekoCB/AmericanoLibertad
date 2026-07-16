import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Evaluation, evaluationTypeLabels } from '@/types/models';

type GradeRow = {
    student_id: number;
    first_name: string;
    last_name: string;
    score: number | null;
    comments: string | null;
};

export default function Edit({
    evaluation,
    students,
}: {
    evaluation: Evaluation;
    students: GradeRow[];
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
            [field]: field === 'score' ? (value === '' ? null : Number(value)) : value,
        };
        setData('grades', grades);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('evaluations.grades.update', evaluation.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Calificar — {evaluation.name}
                </h2>
            }
        >
            <Head title={`Calificar ${evaluation.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        {evaluationTypeLabels[evaluation.type]} · Puntaje
                        máximo: {evaluation.max_score} · Ponderación:{' '}
                        {evaluation.weight}%
                    </div>

                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Estudiante
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Nota
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                            Comentarios
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {students.map((student, index) => (
                                        <tr key={student.student_id}>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                {student.first_name}{' '}
                                                {student.last_name}
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={evaluation.max_score}
                                                    step="0.01"
                                                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                    value={
                                                        data.grades[index]
                                                            ?.score ?? ''
                                                    }
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
                                                        (errors as any)[
                                                            `grades.${index}.score`
                                                        ]
                                                    }
                                                    className="mt-1"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                    value={
                                                        data.grades[index]
                                                            ?.comments ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'comments',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                No hay estudiantes
                                                matriculados activos en este
                                                curso.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar calificaciones
                                </PrimaryButton>
                                <Link
                                    href={route(
                                        'courses.show',
                                        evaluation.course_id,
                                    )}
                                    className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                                >
                                    Volver al curso
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
