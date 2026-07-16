import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Course } from '@/types/models';

export default function Index({ courses }: { courses: Course[] }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Aula virtual
                </h2>
            }
        >
            <Head title="Aula virtual" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={route('aula-virtual.show', course.id)}
                                className="rounded-lg bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800"
                            >
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {course.name} — {course.subject?.name}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {course.teacher
                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                        : 'Sin docente'}{' '}
                                    · {course.period}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                    {course.recursos_aula_count ?? 0} recursos
                                </p>
                            </Link>
                        ))}
                        {courses.length === 0 && (
                            <div className="col-span-full rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
                                No tienes cursos con aula virtual disponible.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
