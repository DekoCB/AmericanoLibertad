import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import { TrashIcon } from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    IngresoManual,
    Paginated,
    ingresoManualCategoriaLabels,
} from '@/types/models';
import { formatDate } from '@/utils/date';
import Form from './Form';

export default function Index({
    ingresos,
    can,
}: {
    ingresos: Paginated<IngresoManual>;
    can: { create: boolean; delete: boolean };
}) {
    const [creating, setCreating] = useState(false);
    const [confirmingDelete, setConfirmingDelete] =
        useState<IngresoManual | null>(null);
    const { delete: destroy, processing } = useForm();

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('ingresos-manuales.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Otros ingresos
                    </h2>
                    <Link
                        href={route('caja.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a flujo de caja
                    </Link>
                </div>
            }
        >
            <Head title="Otros ingresos" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-brand-muted">
                        Ingresos que no provienen de un pago de matrícula o
                        pensión (donaciones, alquileres, servicios, etc.).
                    </p>
                    <div className="flex items-center justify-end">
                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nuevo ingreso
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-[20px] border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Concepto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {ingresos.data.map((ingreso) => (
                                    <tr key={ingreso.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(ingreso.fecha)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {ingreso.concepto}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {
                                                ingresoManualCategoriaLabels[
                                                    ingreso.categoria
                                                ]
                                            }
                                        </td>
                                        <td
                                            className="whitespace-nowrap px-4 py-3 text-sm"
                                            style={{
                                                color: 'var(--money-in)',
                                            }}
                                        >
                                            S/{' '}
                                            {Number(ingreso.monto).toFixed(
                                                2,
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            {can.delete && (
                                                <button
                                                    onClick={() =>
                                                        setConfirmingDelete(
                                                            ingreso,
                                                        )
                                                    }
                                                    className="text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {ingresos.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron ingresos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={ingresos.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo ingreso
                    </h2>
                    <Form
                        onSuccess={() => setCreating(false)}
                        onCancel={() => setCreating(false)}
                    />
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar ingreso?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar &quot;{confirmingDelete.concepto}
                            &quot;. Esta acción no se puede deshacer.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingDelete(null)}
                                className="rounded-xl px-4 py-2 text-sm text-brand-muted hover:bg-brand-cream"
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
