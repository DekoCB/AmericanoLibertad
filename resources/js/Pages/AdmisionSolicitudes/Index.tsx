import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import SearchableSelect from '@/Components/SearchableSelect';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { EyeIcon, InboxIcon, TrashIcon, XMarkIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    AdmissionApplication,
    admisionEstadoLabels,
    Carrera,
    Paginated,
    turnoLabels,
} from '@/types/models';
import { formatDateTime } from '@/utils/date';
import Detail from './Detail';

const estadoBadge: Record<AdmissionApplication['estado'], string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    revisado: 'bg-blue-100 text-blue-800',
    aceptado: 'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
};

type Filters = { search: string; carrera_id: string; estado: string };

export default function Index({
    solicitudes,
    carreras,
    filters,
    can,
}: {
    solicitudes: Paginated<AdmissionApplication>;
    carreras: Pick<Carrera, 'id' | 'name'>[];
    filters: Partial<Filters>;
    can: { delete: boolean };
}) {
    const current: Filters = {
        search: filters.search ?? '',
        carrera_id: filters.carrera_id ?? '',
        estado: filters.estado ?? '',
    };

    const [search, setSearch] = useState(current.search);
    const [viewingId, setViewingId] = useState<number | null>(null);
    const [confirmingDelete, setConfirmingDelete] =
        useState<AdmissionApplication | null>(null);
    const { delete: destroy, processing } = useForm();

    const viewing =
        solicitudes.data.find((s) => s.id === viewingId) ?? null;

    const updateFilter = (key: keyof Filters, value: string) => {
        router.get(
            route('admisiones.index'),
            { ...current, [key]: value },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('search', search);
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('admisiones.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<InboxIcon />}>
                    Solicitudes de admisión
                </PageTitle>
            }
        >
            <Head title="Solicitudes de admisión" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <form
                            onSubmit={submitSearch}
                            className="w-64"
                        >
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre o DNI..."
                                className="w-full"
                            />
                        </form>
                        <div className="w-56">
                            <SearchableSelect
                                value={current.carrera_id}
                                onChange={(value) =>
                                    updateFilter('carrera_id', value)
                                }
                                placeholder="Buscar carrera..."
                                allLabel="Todas las carreras"
                                options={carreras.map((carrera) => ({
                                    value: String(carrera.id),
                                    label: carrera.name,
                                }))}
                            />
                        </div>
                        <div className="w-52">
                            <SearchableSelect
                                value={current.estado}
                                onChange={(value) =>
                                    updateFilter('estado', value)
                                }
                                placeholder="Buscar estado..."
                                allLabel="Todos los estados"
                                options={Object.entries(
                                    admisionEstadoLabels,
                                ).map(([value, label]) => ({
                                    value,
                                    label,
                                }))}
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Solicitante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        DNI
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Carrera
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Turno
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Enviado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {solicitudes.data.map((solicitud) => (
                                    <tr key={solicitud.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {solicitud.nombres}{' '}
                                            {solicitud.apellido_paterno}{' '}
                                            {solicitud.apellido_materno}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {solicitud.dni}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {solicitud.carrera?.name ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {turnoLabels[solicitud.turno]}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDateTime(
                                                solicitud.created_at,
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <span
                                                className={`rounded-lg px-2 py-1 text-xs font-medium ${estadoBadge[solicitud.estado]}`}
                                            >
                                                {
                                                    admisionEstadoLabels[
                                                        solicitud.estado
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <div className="flex items-center justify-end gap-4">
                                                <button
                                                    onClick={() =>
                                                        setViewingId(
                                                            solicitud.id,
                                                        )
                                                    }
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
                                                                solicitud,
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
                                ))}
                                {solicitudes.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron solicitudes de
                                            admisión.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={solicitudes.links} />
                </div>
            </div>

            <Modal
                show={viewingId !== null}
                onClose={() => setViewingId(null)}
                maxWidth="2xl"
            >
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    <div className="relative mb-6 flex items-center justify-center">
                        <h2 className="text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Detalle de la solicitud
                        </h2>
                        <button
                            onClick={() => setViewingId(null)}
                            className="absolute right-0 text-brand-muted hover:text-brand-ink"
                        >
                            <XMarkIcon className="size-5" />
                        </button>
                    </div>
                    {viewing && <Detail solicitud={viewing} />}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar solicitud?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Se eliminará la solicitud de{' '}
                            {confirmingDelete.nombres}{' '}
                            {confirmingDelete.apellido_paterno} y sus
                            documentos adjuntos. Esta acción no se puede
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
