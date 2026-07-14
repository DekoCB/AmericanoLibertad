import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    Course,
    Enrollment,
    enrollmentStatusLabels,
    Evaluation,
    evaluationTypeLabels,
    Student,
} from '@/types/models';

export default function Show({
    course,
    enrollments,
    evaluations,
    availableStudents,
}: {
    course: Course;
    enrollments: Enrollment[];
    evaluations: Evaluation[];
    availableStudents: Pick<Student, 'id' | 'first_name' | 'last_name'>[];
}) {
    const enrollForm = useForm({ student_id: availableStudents[0]?.id ?? '' });

    const submitEnroll = (e: FormEvent) => {
        e.preventDefault();
        enrollForm.post(route('courses.enrollments.store', course.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        {course.name} — {course.subject?.name}
                    </h2>
                    <Link
                        href={route('courses.index')}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                    >
                        Volver a cursos
                    </Link>
                </div>
            }
        >
            <Head title={course.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-6 shadow-sm sm:grid-cols-4 dark:bg-gray-800">
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                Profesor
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                                {course.teacher
                                    ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                    : 'Sin asignar'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                Período
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                                {course.period}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                Horario
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                                {course.schedule ?? '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                Cupos
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                                {enrollments.length} / {course.capacity}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Estudiantes matriculados
                                </h3>
                            </div>

                            {availableStudents.length > 0 && (
                                <form
                                    onSubmit={submitEnroll}
                                    className="mb-4 flex gap-2"
                                >
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={enrollForm.data.student_id}
                                        onChange={(e) =>
                                            enrollForm.setData(
                                                'student_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        {availableStudents.map((student) => (
                                            <option
                                                key={student.id}
                                                value={student.id}
                                            >
                                                {student.first_name}{' '}
                                                {student.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={enrollForm.processing}
                                    >
                                        Matricular
                                    </PrimaryButton>
                                </form>
                            )}

                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {enrollments.map((enrollment) => (
                                    <li
                                        key={enrollment.id}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div>
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {enrollment.student?.first_name}{' '}
                                                {enrollment.student?.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {
                                                    enrollmentStatusLabels[
                                                        enrollment.status
                                                    ]
                                                }
                                            </div>
                                        </div>
                                        <Link
                                            as="button"
                                            method="delete"
                                            href={route(
                                                'courses.enrollments.destroy',
                                                [course.id, enrollment.id],
                                            )}
                                            onBefore={() =>
                                                confirm(
                                                    '¿Quitar esta matrícula del curso?',
                                                )
                                            }
                                            preserveScroll
                                            className="text-sm text-red-600 hover:underline dark:text-red-400"
                                        >
                                            Quitar
                                        </Link>
                                    </li>
                                ))}
                                {enrollments.length === 0 && (
                                    <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                        Aún no hay estudiantes matriculados.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Evaluaciones
                                </h3>
                                <Link
                                    href={route(
                                        'courses.evaluations.create',
                                        course.id,
                                    )}
                                >
                                    <PrimaryButton>
                                        Nueva evaluación
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {evaluations.map((evaluation) => (
                                    <li
                                        key={evaluation.id}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div>
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {evaluation.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {
                                                    evaluationTypeLabels[
                                                        evaluation.type
                                                    ]
                                                }{' '}
                                                · {evaluation.date} ·{' '}
                                                {evaluation.weight}% ·{' '}
                                                {evaluation.grades_count ?? 0}{' '}
                                                notas registradas
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Link
                                                href={route(
                                                    'evaluations.grades.edit',
                                                    evaluation.id,
                                                )}
                                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                Calificar
                                            </Link>
                                            <Link
                                                href={route(
                                                    'evaluations.edit',
                                                    evaluation.id,
                                                )}
                                                className="text-gray-600 hover:underline dark:text-gray-400"
                                            >
                                                Editar
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {evaluations.length === 0 && (
                                    <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                        Aún no hay evaluaciones para este
                                        curso.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
