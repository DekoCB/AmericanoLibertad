import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import { PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Carrera,
    Student,
    studentStatusLabels,
    turnoLabels,
} from '@/types/models';
import Form from './Form';

const SIN_CARRERA = 'Sin carrera';

export default function Index({
    students,
    allStudents,
    filters,
    carreras,
    can,
}: {
    students: Student[];
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

    const sections = useMemo(() => {
        const groups = new Map<string, Student[]>();
        students.forEach((student) => {
            const key = student.carrera?.name ?? SIN_CARRERA;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(student);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === SIN_CARRERA) return 1;
            if (b === SIN_CARRERA) return -1;
            return a.localeCompare(b);
        });
    }, [students]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Estudiantes
                </h2>
            }
        >
            <Head title="Estudiantes" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
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
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nuevo estudiante
                            </PrimaryButton>
                        )}
                    </div>

                    {sections.map(([carreraName, sectionStudents]) => (
                        <div key={carreraName} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-brand-ink-strong">
                                    {carreraName}
                                </h3>
                                <span className="rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                    {sectionStudents.length}
                                </span>
                            </div>

                            <div className="overflow-hidden overflow-x-auto rounded-[20px] border border-brand-border bg-brand-card">
                                <table className="min-w-full divide-y divide-brand-border-faint">
                                    <thead className="bg-brand-thead">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Documento
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Nombre
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Sección
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Matrículas
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border-faint">
                                        {sectionStudents.map((student) => (
                                            <tr key={student.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                    {student.document_number}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                                    {student.first_name}{' '}
                                                    {student.last_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                    {student.email}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                    {student.ciclo
                                                        ? `Ciclo ${student.ciclo}`
                                                        : '—'}
                                                    {student.turno
                                                        ? ` · ${turnoLabels[student.turno]}`
                                                        : ''}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                    {student.enrollments_count ?? 0}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                    <span className="rounded-full bg-brand-hover px-2 py-1 text-xs text-brand-ink">
                                                        {
                                                            studentStatusLabels[
                                                                student.status
                                                            ]
                                                        }
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
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

                    {students.length === 0 && (
                        <div className="rounded-[20px] border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No se encontraron estudiantes.
                        </div>
                    )}
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
                    <div className="w-full max-w-md rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-xl">
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
