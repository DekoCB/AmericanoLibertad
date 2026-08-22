import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { AcademicCapIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Carrera, Paginated } from '@/types/models';
import Form from './Form';

export default function Index({
    carreras,
    can,
}: {
    carreras: Paginated<Carrera>;
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [creating, setCreating] = useState(false);
    const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<Carrera | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('carreras.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<AcademicCapIcon />}>Carreras</PageTitle>
            }
        >
            <Head title="Carreras" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end">
                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nueva carrera
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Código
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Ciclos
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estudiantes
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Cursos
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {carreras.data.map((carrera) => (
                                    <tr key={carrera.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {carrera.code}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {carrera.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {carrera.total_ciclos}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {carrera.students_count ?? 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {carrera.subjects_count ?? 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            {can.update && (
                                                <button
                                                    onClick={() => {
                                                        setEditingCarrera(
                                                            carrera,
                                                        );
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="text-brand-link hover:opacity-70"
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
                                                            carrera,
                                                        )
                                                    }
                                                    className="ms-4 text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {carreras.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron carreras.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={carreras.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva carrera
                    </h2>
                    <Form
                        onSuccess={() => setCreating(false)}
                        onCancel={() => setCreating(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={editModalOpen}
                onClose={() => setEditModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar carrera
                    </h2>
                    {editingCarrera && (
                        <Form
                            carrera={editingCarrera}
                            onSuccess={() => setEditModalOpen(false)}
                            onCancel={() => setEditModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar carrera?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar {confirmingDelete.name}. Esta
                            acción no se puede deshacer.
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
