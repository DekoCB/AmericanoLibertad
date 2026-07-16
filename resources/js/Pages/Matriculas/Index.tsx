import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Matricula, Paginated, cuotaEstadoLabels, turnoLabels } from '@/types/models';

export default function Index({
    matriculas,
    filters,
    can,
}: {
    matriculas: Paginated<Matricula>;
    filters: { search?: string };
    can: { create: boolean; delete: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirmingDelete, setConfirmingDelete] = useState<Matricula | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('matriculas.index'), { search }, { preserveState: true });
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('matriculas.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    const estadoBadge: Record<Matricula['estado'], string> = {
        pendiente:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        parcial:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        pagado:
            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        vencido: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Matrículas
                </h2>
            }
        >
            <Head title="Matrículas" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={submitSearch} className="flex gap-2">
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar estudiante..."
                                className="w-64"
                            />
                            <PrimaryButton type="submit">
                                Buscar
                            </PrimaryButton>
                        </form>

                        {can.create && (
                            <Link href={route('matriculas.create')}>
                                <PrimaryButton>Nueva matrícula</PrimaryButton>
                            </Link>
                        )}
                    </div>

                    <div className="overflow-hidden overflow-x-auto bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Carrera
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Ciclo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Turno
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Periodo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Saldo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {matriculas.data.map((matricula) => {
                                    const total = matricula.saldo_total ?? 0;
                                    const pagado = matricula.pagado_total ?? 0;
                                    return (
                                        <tr key={matricula.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {matricula.student
                                                    ? `${matricula.student.first_name} ${matricula.student.last_name}`
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {matricula.carrera?.name ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {matricula.ciclo}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {turnoLabels[matricula.turno]}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {matricula.period}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                S/ {pagado.toFixed(2)} / S/{' '}
                                                {total.toFixed(2)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${estadoBadge[matricula.estado]}`}
                                                >
                                                    {cuotaEstadoLabels[matricula.estado]}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                <Link
                                                    href={route(
                                                        'matriculas.show',
                                                        matricula.id,
                                                    )}
                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    Ver
                                                </Link>
                                                {can.delete && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmingDelete(
                                                                matricula,
                                                            )
                                                        }
                                                        className="ms-4 text-red-600 hover:underline dark:text-red-400"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {matriculas.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No se encontraron matrículas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={matriculas.links} />
                </div>
            </div>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ¿Eliminar matrícula?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Se eliminará la matrícula y sus cuotas/pagos
                            asociados. Esta acción no se puede deshacer.
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
