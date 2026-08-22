import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { PencilIcon, ShieldCheckIcon, TrashIcon } from '@/Components/Icons';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated } from '@/types/models';
import { userRoleLabels } from '@/types/models';
import { PageProps, User, UserRole } from '@/types';
import Form from './Form';

type UserWithLinks = User & {
    teacher: { first_name: string; last_name: string } | null;
    student: { first_name: string; last_name: string } | null;
};

interface PersonOption {
    id: number;
    first_name: string;
    last_name: string;
}

export default function Index({
    users,
    allUsers,
    filters,
    roles,
    teachers,
    students,
}: {
    users: Paginated<UserWithLinks>;
    allUsers: Pick<User, 'id' | 'name' | 'email'>[];
    filters: { user_id?: string };
    roles: UserRole[];
    teachers: PersonOption[];
    students: PersonOption[];
}) {
    const currentUser = usePage<PageProps>().props.auth.user;
    const [userId, setUserId] = useState(filters.user_id ?? '');
    const [creating, setCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithLinks | null>(
        null,
    );
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] =
        useState<UserWithLinks | null>(null);
    const { delete: destroy, processing } = useForm();

    const changeUser = (nuevoUserId: string) => {
        setUserId(nuevoUserId);
        router.get(
            route('users.index'),
            { user_id: nuevoUserId },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('users.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<ShieldCheckIcon />}>Usuarios</PageTitle>
            }
        >
            <Head title="Usuarios" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full max-w-sm">
                            <SearchableSelect
                                value={userId}
                                onChange={changeUser}
                                placeholder="Buscar por nombre o email"
                                allLabel="Todos los usuarios"
                                options={allUsers.map((user) => ({
                                    value: String(user.id),
                                    label: user.name,
                                    searchText: `${user.name} ${user.email}`,
                                }))}
                            />
                        </div>

                        <PrimaryButton onClick={() => setCreating(true)}>
                            Nuevo usuario
                        </PrimaryButton>
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Rol
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Vinculado a
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {users.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {user.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {user.email}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <span className="rounded-lg bg-brand-hover px-2 py-1 text-xs text-brand-ink">
                                                {userRoleLabels[user.role]}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {user.teacher
                                                ? `${user.teacher.first_name} ${user.teacher.last_name}`
                                                : user.student
                                                  ? `${user.student.first_name} ${user.student.last_name}`
                                                  : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setEditModalOpen(true);
                                                }}
                                                className="text-brand-link hover:opacity-70"
                                                title="Editar"
                                                aria-label="Editar"
                                            >
                                                <PencilIcon className="size-4" />
                                            </button>
                                            {currentUser.id !== user.id && (
                                                <button
                                                    onClick={() =>
                                                        setConfirmingDelete(
                                                            user,
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
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={users.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo usuario
                    </h2>
                    <Form
                        roles={roles}
                        teachers={teachers}
                        students={students}
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
                        Editar usuario
                    </h2>
                    {editingUser && (
                        <Form
                            user={editingUser}
                            roles={roles}
                            teachers={teachers}
                            students={students}
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
                            ¿Eliminar usuario?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar la cuenta de{' '}
                            {confirmingDelete.name}. Esta acción no se puede
                            deshacer.
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
