import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Course, Paginated } from '@/types/models';

export default function Index({
    courses,
    filters,
}: {
    courses: Paginated<Course>;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirmingDelete, setConfirmingDelete] = useState<Course | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('courses.index'),
            { search },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('courses.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Cursos
                </h2>
            }
        >
            <Head title="Cursos" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={submitSearch}
                            className="flex w-full max-w-sm gap-2"
                        >
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre o materia"
                                className="w-full"
                            />
                            <PrimaryButton type="submit">
                                Buscar
                            </PrimaryButton>
                        </form>

                        <Link href={route('courses.create')}>
                            <PrimaryButton>Nuevo curso</PrimaryButton>
                        </Link>
                    </div>

                    <div className="overflow-hidden overflow-x-auto bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Curso
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Materia
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Profesor
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Período
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Matriculados
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {courses.data.map((course) => (
                                    <tr key={course.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            <Link
                                                href={route(
                                                    'courses.show',
                                                    course.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {course.name}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {course.subject?.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {course.teacher
                                                ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                                : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {course.period}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {course.enrollments_count ?? 0} /{' '}
                                            {course.capacity}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <Link
                                                href={route(
                                                    'courses.edit',
                                                    course.id,
                                                )}
                                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    setConfirmingDelete(course)
                                                }
                                                className="ms-4 text-red-600 hover:underline dark:text-red-400"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {courses.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No se encontraron cursos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={courses.links} />
                </div>
            </div>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ¿Eliminar curso?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Vas a eliminar {confirmingDelete.name}. Las
                            matrículas, evaluaciones y calificaciones
                            asociadas también se eliminarán.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingDelete(null)}
                                className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <DangerButton
                                onClick={confirmDelete}
                                disabled={processing}
                            >
                                Eliminar
                            </DangerButton>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
