import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Pagination from '@/Components/Pagination';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Egreso, Paginated, egresoCategoriaLabels } from '@/types/models';

export default function Index({
    egresos,
    can,
}: {
    egresos: Paginated<Egreso>;
    can: { create: boolean; delete: boolean };
}) {
    const [confirmingDelete, setConfirmingDelete] = useState<Egreso | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('egresos.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Egresos
                </h2>
            }
        >
            <Head title="Egresos" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('caja.index')}
                            className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                        >
                            ← Volver a Flujo de Caja
                        </Link>
                        {can.create && (
                            <Link href={route('egresos.create')}>
                                <PrimaryButton>Nuevo egreso</PrimaryButton>
                            </Link>
                        )}
                    </div>

                    <div className="overflow-hidden overflow-x-auto bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Concepto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {egresos.data.map((egreso) => (
                                    <tr key={egreso.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {egreso.fecha}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {egreso.concepto}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {egresoCategoriaLabels[egreso.categoria]}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                            S/ {Number(egreso.monto).toFixed(2)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            {can.delete && (
                                                <button
                                                    onClick={() =>
                                                        setConfirmingDelete(
                                                            egreso,
                                                        )
                                                    }
                                                    className="text-red-600 hover:underline dark:text-red-400"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {egresos.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No se encontraron egresos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={egresos.links} />
                </div>
            </div>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ¿Eliminar egreso?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Vas a eliminar &quot;{confirmingDelete.concepto}
                            &quot;. Esta acción no se puede deshacer.
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
