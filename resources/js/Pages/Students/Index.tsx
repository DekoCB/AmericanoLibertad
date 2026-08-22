import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import UserAvatar from '@/Components/UserAvatar';
import {
    ArrowUpTrayIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
} from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    Carrera,
    Paginated,
    Student,
    studentStatusLabels,
    turnoLabels,
} from '@/types/models';
import Form from './Form';

export default function Index({
    students,
    allStudents,
    filters,
    carreras,
    can,
}: {
    students: Paginated<Student>;
    allStudents: Pick<
        Student,
        'id' | 'first_name' | 'last_name' | 'email' | 'document_number'
    >[];
    filters: { student_id?: string; carrera_id?: string };
    carreras: Carrera[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [studentId, setStudentId] = useState(filters.student_id ?? '');
    const [carreraId, setCarreraId] = useState(filters.carrera_id ?? '');
    const [creating, setCreating] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(
        null,
    );
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<Student | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const changeStudent = (nuevoStudentId: string) => {
        setStudentId(nuevoStudentId);
        router.get(
            route('students.index'),
            { student_id: nuevoStudentId, carrera_id: carreraId },
            { preserveState: true, replace: true },
        );
    };

    const changeCarrera = (nuevaCarreraId: string) => {
        setCarreraId(nuevaCarreraId);
        router.get(
            route('students.index'),
            { student_id: studentId, carrera_id: nuevaCarreraId },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('students.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    const statusBadge: Record<Student['status'], string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        graduated: 'bg-blue-100 text-blue-800',
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<UsersIcon />}>Estudiantes</PageTitle>
            }
        >
            <Head title="Estudiantes" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                            <div className="w-full max-w-sm">
                                <SearchableSelect
                                    value={studentId}
                                    onChange={changeStudent}
                                    placeholder="Buscar por nombre, documento o email"
                                    allLabel="Todos los estudiantes"
                                    options={allStudents.map((student) => ({
                                        value: String(student.id),
                                        label: `${student.first_name} ${student.last_name}`,
                                        searchText: `${student.first_name} ${student.last_name} ${student.email} ${student.document_number}`,
                                    }))}
                                />
                            </div>

                            <div className="w-56">
                                <SearchableSelect
                                    value={carreraId}
                                    onChange={changeCarrera}
                                    placeholder="Buscar carrera..."
                                    allLabel="Todas las carreras"
                                    options={carreras.map((carrera) => ({
                                        value: String(carrera.id),
                                        label: carrera.name,
                                    }))}
                                />
                            </div>
                        </div>

                        {can.create && (
                            <div className="flex shrink-0 items-center gap-3">
                                <Link href={route('students.import')}>
                                    <SecondaryButton className="inline-flex items-center gap-2">
                                        <ArrowUpTrayIcon className="size-4" />
                                        Importar desde Excel
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton
                                    onClick={() => setCreating(true)}
                                >
                                    Nuevo estudiante
                                </PrimaryButton>
                            </div>
                        )}
                    </div>

                    {students.data.length > 0 ? (
                        <div className="grid grid-cols-1 border-l border-t border-brand-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {students.data.map((student) => (
                                <div
                                    key={student.id}
                                    className="relative flex flex-col items-center gap-3 border-b border-r border-brand-border bg-brand-card p-4 pt-10 text-center transition hover:bg-brand-hover"
                                >
                                    {(can.update || can.delete) && (
                                        <div className="absolute right-3 top-3 flex items-center gap-3">
                                            {can.update && (
                                                <button
                                                    onClick={() => {
                                                        setEditingStudent(
                                                            student,
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
                                                            student,
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
                                        src={student.user?.avatar_url}
                                        size="size-20"
                                        iconSize="size-12"
                                    />

                                    <div>
                                        <div className="leading-snug font-semibold text-brand-ink-strong">
                                            {student.first_name}{' '}
                                            {student.last_name}
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {student.document_number}
                                        </div>
                                    </div>

                                    <div className="w-full space-y-1 text-sm text-brand-ink">
                                        <div className="truncate">
                                            {student.email}
                                        </div>
                                        <div className="text-brand-muted">
                                            {student.carrera?.name ?? 'Sin carrera asignada'}
                                        </div>
                                        <div className="text-brand-muted">
                                            {student.ciclo
                                                ? `Ciclo ${student.ciclo}`
                                                : '—'}
                                            {student.turno
                                                ? ` · ${turnoLabels[student.turno]}`
                                                : ''}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex w-full items-center justify-between border-t border-brand-border-faint pt-3">
                                        <span className="text-xs text-brand-muted">
                                            {student.enrollments_count ?? 0}{' '}
                                            matrícula
                                            {student.enrollments_count === 1
                                                ? ''
                                                : 's'}
                                        </span>
                                        <span
                                            className={`rounded-lg px-2 py-1 text-xs font-medium ${statusBadge[student.status]}`}
                                        >
                                            {studentStatusLabels[student.status]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No se encontraron estudiantes.
                        </div>
                    )}

                    <Pagination links={students.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo estudiante
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
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar estudiante
                    </h2>
                    {editingStudent && (
                        <Form
                            student={editingStudent}
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
                            ¿Eliminar estudiante?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar a {confirmingDelete.first_name}{' '}
                            {confirmingDelete.last_name}. Esta acción no se
                            puede deshacer.
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
