import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import UserAvatar from '@/Components/UserAvatar';
import { BriefcaseIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, Teacher } from '@/types/models';
import Form from './Form';

export default function Index({
    teachers,
    allTeachers,
    filters,
    specialties,
    can,
}: {
    teachers: Paginated<Teacher>;
    allTeachers: Pick<Teacher, 'id' | 'first_name' | 'last_name' | 'email'>[];
    filters: { teacher_id?: string; specialty?: string };
    specialties: string[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [teacherId, setTeacherId] = useState(filters.teacher_id ?? '');
    const [specialty, setSpecialty] = useState(filters.specialty ?? '');
    const [creating, setCreating] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(
        null,
    );
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<Teacher | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const changeTeacher = (nuevoTeacherId: string) => {
        setTeacherId(nuevoTeacherId);
        router.get(
            route('teachers.index'),
            { teacher_id: nuevoTeacherId, specialty },
            { preserveState: true, replace: true },
        );
    };

    const changeSpecialty = (nuevaSpecialty: string) => {
        setSpecialty(nuevaSpecialty);
        router.get(
            route('teachers.index'),
            { teacher_id: teacherId, specialty: nuevaSpecialty },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('teachers.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<BriefcaseIcon />}>Profesores</PageTitle>
            }
        >
            <Head title="Profesores" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                            <div className="w-full max-w-sm">
                                <SearchableSelect
                                    value={teacherId}
                                    onChange={changeTeacher}
                                    placeholder="Buscar por nombre o email"
                                    allLabel="Todos los profesores"
                                    options={allTeachers.map((teacher) => ({
                                        value: String(teacher.id),
                                        label: `${teacher.first_name} ${teacher.last_name}`,
                                        searchText: `${teacher.first_name} ${teacher.last_name} ${teacher.email}`,
                                    }))}
                                />
                            </div>

                            <div className="w-56">
                                <SearchableSelect
                                    value={specialty}
                                    onChange={changeSpecialty}
                                    placeholder="Buscar especialidad..."
                                    allLabel="Todas las especialidades"
                                    options={specialties.map((item) => ({
                                        value: item,
                                        label: item,
                                    }))}
                                />
                            </div>
                        </div>

                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nuevo profesor
                            </PrimaryButton>
                        )}
                    </div>

                    {teachers.data.length > 0 ? (
                        <div className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t border-brand-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {teachers.data.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="relative flex flex-col items-center gap-3 border-b border-r border-brand-border bg-brand-card p-4 pt-10 text-center transition hover:bg-brand-hover"
                                >
                                    {(can.update || can.delete) && (
                                        <div className="absolute right-3 top-3 flex items-center gap-3">
                                            {can.update && (
                                                <button
                                                    onClick={() => {
                                                        setEditingTeacher(
                                                            teacher,
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
                                                            teacher,
                                                        )
                                                    }
                                                    className="text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <UserAvatar
                                        src={teacher.user?.avatar_url}
                                        size="size-20"
                                        iconSize="size-12"
                                    />

                                    <div>
                                        <div className="leading-snug font-semibold text-brand-ink-strong">
                                            {teacher.first_name}{' '}
                                            {teacher.last_name}
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {teacher.email}
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-wrap justify-center gap-1">
                                        {teacher.specialty && teacher.specialty.length > 0 ? (
                                            teacher.specialty.map((specialty) => (
                                                <span
                                                    key={specialty}
                                                    className="whitespace-nowrap rounded-lg bg-brand-hover px-2 py-0.5 text-xs text-brand-ink"
                                                >
                                                    {specialty}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-brand-muted">
                                                Sin especialidad asignada
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto w-full border-t border-brand-border-faint pt-3 text-xs text-brand-muted">
                                        {teacher.courses_count ?? 0} sección
                                        {teacher.courses_count === 1 ? '' : 'es'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No se encontraron profesores.
                        </div>
                    )}

                    <Pagination links={teachers.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo profesor
                    </h2>
                    <Form
                        specialties={specialties}
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
                        Editar profesor
                    </h2>
                    {editingTeacher && (
                        <Form
                            teacher={editingTeacher}
                            specialties={specialties}
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
                            ¿Eliminar profesor?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar a {confirmingDelete.first_name}{' '}
                            {confirmingDelete.last_name}. Las secciones
                            asignadas quedarán sin profesor.
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
