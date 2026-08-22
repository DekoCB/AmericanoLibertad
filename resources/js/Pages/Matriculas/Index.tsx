import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { CreditCardIcon, EyeIcon, TrashIcon, XMarkIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    Carrera,
    Matricula,
    Paginated,
    Student,
    cuotaEstadoLabels,
    turnoLabels,
} from '@/types/models';
import Form from './Form';
import MatriculaDetail from './MatriculaDetail';

type StudentOption = Pick<
    Student,
    | 'id'
    | 'first_name'
    | 'last_name'
    | 'document_number'
    | 'carrera_id'
    | 'ciclo'
    | 'turno'
>;

export default function Index({
    matriculas,
    filters,
    students,
    carreras,
    can,
}: {
    matriculas: Paginated<Matricula>;
    filters: { student_id?: string; carrera_id?: string };
    students: StudentOption[];
    carreras: Carrera[];
    can: {
        create: boolean;
        delete: boolean;
        manage: boolean;
        registerPayment: boolean;
    };
}) {
    const [studentId, setStudentId] = useState(filters.student_id ?? '');
    const [carreraId, setCarreraId] = useState(filters.carrera_id ?? '');
    const [creating, setCreating] = useState(false);
    const [viewingMatriculaId, setViewingMatriculaId] = useState<
        number | null
    >(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<Matricula | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const viewingMatricula =
        matriculas.data.find((m) => m.id === viewingMatriculaId) ?? null;

    const changeStudent = (nuevoStudentId: string) => {
        setStudentId(nuevoStudentId);
        router.get(
            route('matriculas.index'),
            { student_id: nuevoStudentId, carrera_id: carreraId },
            { preserveState: true },
        );
    };

    const changeCarrera = (nuevaCarreraId: string) => {
        setCarreraId(nuevaCarreraId);
        router.get(
            route('matriculas.index'),
            { student_id: studentId, carrera_id: nuevaCarreraId },
            { preserveState: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('matriculas.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    const estadoBadge: Record<Matricula['estado'], string> = {
        pendiente:
            'bg-yellow-100 text-yellow-800',
        parcial:
            'bg-blue-100 text-blue-800',
        pagado:
            'bg-green-100 text-green-800',
        vencido: 'bg-red-100 text-red-800',
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CreditCardIcon />}>Matrículas</PageTitle>
            }
        >
            <Head title="Matrículas" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="w-64">
                                <SearchableSelect
                                    value={studentId}
                                    onChange={changeStudent}
                                    placeholder="Buscar estudiante..."
                                    allLabel="Todos los estudiantes"
                                    options={students.map((student) => ({
                                        value: String(student.id),
                                        label: `${student.first_name} ${student.last_name}`,
                                        searchText: `${student.first_name} ${student.last_name} ${student.document_number}`,
                                    }))}
                                />
                            </div>
                            <div className="w-64">
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
                                Nueva matrícula
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Carrera
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Ciclo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Turno
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Periodo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Saldo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {matriculas.data.map((matricula) => {
                                    const total = matricula.saldo_total ?? 0;
                                    const pagado = matricula.pagado_total ?? 0;
                                    return (
                                        <tr key={matricula.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                                {matricula.student
                                                    ? `${matricula.student.first_name} ${matricula.student.last_name}`
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {matricula.carrera?.name ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {matricula.ciclo}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {turnoLabels[matricula.turno]}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {matricula.period}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                S/ {pagado.toFixed(2)} / S/{' '}
                                                {total.toFixed(2)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                <span
                                                    className={`rounded-lg px-2 py-1 text-xs font-medium ${estadoBadge[matricula.estado]}`}
                                                >
                                                    {cuotaEstadoLabels[matricula.estado]}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                <div className="flex items-center justify-end gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setViewingMatriculaId(
                                                                matricula.id,
                                                            );
                                                            setViewModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="text-brand-link hover:opacity-70"
                                                        title="Ver"
                                                        aria-label="Ver"
                                                    >
                                                        <EyeIcon className="size-4" />
                                                    </button>
                                                    {can.delete && (
                                                        <button
                                                            onClick={() =>
                                                                setConfirmingDelete(
                                                                    matricula,
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
                                            </td>
                                        </tr>
                                    );
                                })}
                                {matriculas.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron matrículas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={matriculas.links} />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva matrícula
                    </h2>
                    <Form
                        students={students}
                        carreras={carreras}
                        onSuccess={() => setCreating(false)}
                        onCancel={() => setCreating(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    <div className="relative mb-6 flex items-center justify-center">
                        <h2 className="text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Detalle de matrícula
                        </h2>
                        <button
                            onClick={() => setViewModalOpen(false)}
                            className="absolute right-0 text-brand-muted hover:text-brand-ink"
                        >
                            <XMarkIcon className="size-5" />
                        </button>
                    </div>
                    {viewingMatricula && (
                        <MatriculaDetail
                            matricula={viewingMatricula}
                            can={can}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar matrícula?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Se eliminará la matrícula y sus cuotas/pagos
                            asociados. Esta acción no se puede deshacer.
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
