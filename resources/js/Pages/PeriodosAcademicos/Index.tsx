import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PageTitle from '@/Components/PageTitle';
import PrimaryButton from '@/Components/PrimaryButton';
import { CalendarDaysIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PeriodoAcademico } from '@/types/models';
import { formatDate } from '@/utils/date';
import Form from './Form';

export default function Index({
    periodos,
    can,
}: {
    periodos: PeriodoAcademico[];
    can: { create: boolean; delete: boolean };
}) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<PeriodoAcademico | null>(null);
    const [confirmingDelete, setConfirmingDelete] =
        useState<PeriodoAcademico | null>(null);
    const { delete: destroy, processing } = useForm();

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('periodos-academicos.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <PageTitle icon={<CalendarDaysIcon />}>
                        Períodos académicos
                    </PageTitle>
                    {can.create && (
                        <PrimaryButton onClick={() => setCreating(true)}>
                            Nuevo período
                        </PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title="Períodos académicos" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-4xl space-y-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-brand-muted">
                        Cada período define el rango de fechas de un ciclo
                        académico (ej. "2026-2"). Al crear cursos o
                        matrículas dentro de un período, sus fechas quedan
                        vinculadas a este rango.
                    </p>

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Fecha inicio
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Fecha fin
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Cursos
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {periodos.map((periodo) => (
                                    <tr key={periodo.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {periodo.nombre}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(periodo.fecha_inicio)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(periodo.fecha_fin)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {periodo.courses_count ?? 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <span
                                                className={`rounded-lg px-2 py-1 text-xs font-medium ${
                                                    periodo.activo
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-brand-hover text-brand-muted'
                                                }`}
                                            >
                                                {periodo.activo
                                                    ? 'Activo'
                                                    : 'Cerrado'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            {can.create && (
                                                <button
                                                    onClick={() =>
                                                        setEditing(periodo)
                                                    }
                                                    className="text-brand-muted hover:opacity-70"
                                                    title="Editar"
                                                    aria-label="Editar"
                                                >
                                                    <PencilIcon className="size-4" />
                                                </button>
                                            )}
                                            {can.delete && (
                                                <button
                                                    onClick={() =>
                                                        setConfirmingDelete(
                                                            periodo,
                                                        )
                                                    }
                                                    className="ms-3 text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {periodos.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No hay períodos académicos
                                            registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo período académico
                    </h2>
                    <Form
                        onSuccess={() => setCreating(false)}
                        onCancel={() => setCreating(false)}
                    />
                </div>
            </Modal>

            <Modal show={editing !== null} onClose={() => setEditing(null)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar período académico
                    </h2>
                    {editing && (
                        <Form
                            periodo={editing}
                            onSuccess={() => setEditing(null)}
                            onCancel={() => setEditing(null)}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar período académico?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar &quot;{confirmingDelete.nombre}
                            &quot;. Los cursos y matrículas que lo usan
                            quedarán sin período asignado.
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
