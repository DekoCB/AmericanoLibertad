import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { BookOpenIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Carrera, Paginated, Subject } from '@/types/models';
import Form from './Form';

export default function Index({
    subjects,
    nombresMaterias,
    carreras,
    filters,
    can,
}: {
    subjects: Paginated<Subject>;
    nombresMaterias: string[];
    carreras: Pick<Carrera, 'id' | 'name' | 'code' | 'total_ciclos'>[];
    filters: { name?: string };
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [name, setName] = useState(filters.name ?? '');
    const [creating, setCreating] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(
        null,
    );
    const [confirmingDelete, setConfirmingDelete] = useState<Subject | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const changeName = (nuevoNombre: string) => {
        setName(nuevoNombre);
        router.get(
            route('subjects.index'),
            { name: nuevoNombre },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('subjects.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<BookOpenIcon />}>Cursos</PageTitle>
            }
        >
            <Head title="Cursos" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full max-w-sm">
                            <SearchableSelect
                                value={name}
                                onChange={changeName}
                                placeholder="Buscar por nombre de curso"
                                allLabel="Todos los cursos"
                                options={nombresMaterias.map((nombre) => ({
                                    value: nombre,
                                    label: nombre,
                                }))}
                            />
                        </div>

                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nuevo curso
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
                                        Carrera
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Ciclo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Horas crédito
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Secciones
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {subjects.data.map((subject) => (
                                    <tr key={subject.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {subject.code}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {subject.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {subject.carrera?.name ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {subject.ciclo ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {subject.credit_hours}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {subject.courses_count ?? 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            {can.update && (
                                                <button
                                                    onClick={() => {
                                                        setEditingSubject(
                                                            subject,
                                                        );
                                                        setEditModalOpen(
                                                            true,
                                                        );
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
                                                            subject,
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
                                {subjects.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron cursos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={subjects.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo curso
                    </h2>
                    <Form
                        carreras={carreras}
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
                        Editar curso
                    </h2>
                    {editingSubject && (
                        <Form
                            subject={editingSubject}
                            carreras={carreras}
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
                            ¿Eliminar curso?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar {confirmingDelete.name}. Las
                            secciones asociadas también se eliminarán.
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
