import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import PageTitle from '@/Components/PageTitle';
import { BookOpenIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Subject } from '@/types/models';
import Form from './Form';

const SIN_CARRERA = 'Sin carrera';

export default function Index({
    subjects,
    nombresMaterias,
    filters,
    can,
}: {
    subjects: Subject[];
    nombresMaterias: string[];
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

    const sections = useMemo(() => {
        const groups = new Map<string, Subject[]>();
        subjects.forEach((subject) => {
            const key = subject.carrera?.name ?? SIN_CARRERA;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(subject);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === SIN_CARRERA) return 1;
            if (b === SIN_CARRERA) return -1;
            return a.localeCompare(b);
        });
    }, [subjects]);

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('subjects.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<BookOpenIcon />}>Materias</PageTitle>
            }
        >
            <Head title="Materias" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full max-w-sm">
                            <SearchableSelect
                                value={name}
                                onChange={changeName}
                                placeholder="Buscar por nombre de materia"
                                allLabel="Todas las materias"
                                options={nombresMaterias.map((nombre) => ({
                                    value: nombre,
                                    label: nombre,
                                }))}
                            />
                        </div>

                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nueva materia
                            </PrimaryButton>
                        )}
                    </div>

                    {sections.map(([carreraName, sectionSubjects]) => (
                        <div key={carreraName} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-brand-ink-strong">
                                    {carreraName}
                                </h3>
                                <span className="rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                    {sectionSubjects.length}
                                </span>
                            </div>

                            <div className="overflow-hidden overflow-x-auto rounded-[20px] border border-brand-border bg-brand-card">
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
                                                Ciclo
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Horas crédito
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Cursos
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border-faint">
                                        {sectionSubjects.map((subject) => (
                                            <tr key={subject.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                    {subject.code}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                                    {subject.name}
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
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {subjects.length === 0 && (
                        <div className="rounded-[20px] border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No se encontraron materias.
                        </div>
                    )}
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva materia
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
                        Editar materia
                    </h2>
                    {editingSubject && (
                        <Form
                            subject={editingSubject}
                            onSuccess={() => setEditModalOpen(false)}
                            onCancel={() => setEditModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar materia?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar {confirmingDelete.name}. Los cursos
                            asociados también se eliminarán.
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
