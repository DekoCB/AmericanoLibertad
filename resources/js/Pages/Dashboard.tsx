import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Enrollment, Evaluation, evaluationTypeLabels } from '@/types/models';

interface Stats {
    students: number;
    activeStudents: number;
    teachers: number;
    subjects: number;
    courses: number;
    activeEnrollments: number;
    averageScore: number;
}

export default function Dashboard({
    stats,
    recentEnrollments,
    upcomingEvaluations,
}: {
    stats: Stats;
    recentEnrollments: Enrollment[];
    upcomingEvaluations: Evaluation[];
}) {
    const cards: { label: string; value: number | string; href: string }[] = [
        {
            label: 'Estudiantes activos',
            value: `${stats.activeStudents} / ${stats.students}`,
            href: route('students.index'),
        },
        {
            label: 'Profesores',
            value: stats.teachers,
            href: route('teachers.index'),
        },
        {
            label: 'Materias',
            value: stats.subjects,
            href: route('subjects.index'),
        },
        {
            label: 'Cursos',
            value: stats.courses,
            href: route('courses.index'),
        },
        {
            label: 'Matrículas activas',
            value: stats.activeEnrollments,
            href: route('courses.index'),
        },
        {
            label: 'Promedio general',
            value: stats.averageScore || '—',
            href: route('courses.index'),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        {cards.map((card) => (
                            <Link
                                key={card.label}
                                href={card.href}
                                className="rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-gray-800"
                            >
                                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {card.value}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {card.label}
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Matrículas recientes
                            </h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recentEnrollments.map((enrollment) => (
                                    <li key={enrollment.id} className="py-2">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">
                                            {enrollment.student?.first_name}{' '}
                                            {enrollment.student?.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {enrollment.course?.subject?.name}{' '}
                                            — {enrollment.course?.name}
                                        </div>
                                    </li>
                                ))}
                                {recentEnrollments.length === 0 && (
                                    <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                        Aún no hay matrículas registradas.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Próximas evaluaciones
                            </h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {upcomingEvaluations.map((evaluation) => (
                                    <li key={evaluation.id} className="py-2">
                                        <Link
                                            href={route(
                                                'courses.show',
                                                evaluation.course_id,
                                            )}
                                            className="text-sm text-gray-900 hover:underline dark:text-gray-100"
                                        >
                                            {evaluation.name} —{' '}
                                            {evaluation.course?.subject?.name}
                                        </Link>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {
                                                evaluationTypeLabels[
                                                    evaluation.type
                                                ]
                                            }{' '}
                                            · {evaluation.date}
                                        </div>
                                    </li>
                                ))}
                                {upcomingEvaluations.length === 0 && (
                                    <li className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                        No hay evaluaciones próximas.
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
