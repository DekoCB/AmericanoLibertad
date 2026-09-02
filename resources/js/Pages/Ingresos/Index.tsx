import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableSelect from '@/Components/SearchableSelect';
import SecondaryButton from '@/Components/SecondaryButton';
import { DocumentTextIcon } from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, Pago, medioPagoLabels } from '@/types/models';
import { formatDate } from '@/utils/date';
import IngresoManualForm from '../IngresosManuales/Form';

export default function Index({
    pagos,
    conceptos,
    filters,
    can,
    pagosPendientes = [],
}: {
    pagos: Paginated<Pago>;
    conceptos: { value: string; label: string }[];
    filters: { concepto?: string };
    can: { createIngresoManual: boolean; confirmarPagos: boolean };
    pagosPendientes?: Pago[];
}) {
    const [concepto, setConcepto] = useState(filters.concepto ?? '');
    const [creatingIngreso, setCreatingIngreso] = useState(false);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const confirmForm = useForm({});
    const rechazarForm = useForm({ motivo: '' });
    const variosForm = useForm<{ pago_ids: number[] }>({ pago_ids: [] });

    const confirmarPago = (pago: Pago) => {
        if (!confirm('¿Aprobar este pago?')) return;
        confirmForm.patch(route('pagos.confirmar', pago.id));
    };

    const rechazarPago = (pago: Pago) => {
        const motivo = window.prompt('Motivo del rechazo:');
        if (!motivo) return;
        rechazarForm.transform((data) => ({ ...data, motivo }));
        rechazarForm.patch(route('pagos.rechazar', pago.id));
    };

    const toggleSeleccionado = (pagoId: number, checked: boolean) => {
        setSeleccionados((prev) =>
            checked ? [...prev, pagoId] : prev.filter((id) => id !== pagoId),
        );
    };

    const aprobarSeleccionados = () => {
        if (seleccionados.length === 0) return;
        if (!confirm(`¿Aprobar ${seleccionados.length} pago(s)?`)) return;

        variosForm.transform((data) => ({ ...data, pago_ids: seleccionados }));
        variosForm.post(route('pagos.confirmar-varios'), {
            onSuccess: () => setSeleccionados([]),
        });
    };

    const changeConcepto = (nuevoConcepto: string) => {
        setConcepto(nuevoConcepto);
        router.get(
            route('ingresos.index'),
            { concepto: nuevoConcepto },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Ingresos
                    </h2>
                    <Link
                        href={route('caja.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a flujo de caja
                    </Link>
                </div>
            }
        >
            <Head title="Ingresos" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="w-full max-w-sm">
                            <SearchableSelect
                                value={concepto}
                                onChange={changeConcepto}
                                placeholder="Buscar por concepto"
                                allLabel="Todos los conceptos"
                                options={conceptos}
                            />
                        </div>
                        {can.createIngresoManual && (
                            <PrimaryButton
                                onClick={() => setCreatingIngreso(true)}
                            >
                                Nuevo ingreso manual
                            </PrimaryButton>
                        )}
                    </div>

                    {can.confirmarPagos && pagosPendientes.length > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-amber-900">
                                    Pagos pendientes de aprobación
                                </h3>
                                {seleccionados.length > 0 && (
                                    <PrimaryButton
                                        onClick={aprobarSeleccionados}
                                        disabled={variosForm.processing}
                                    >
                                        Aprobar seleccionados (
                                        {seleccionados.length})
                                    </PrimaryButton>
                                )}
                            </div>
                            <ul className="divide-y divide-amber-200">
                                {pagosPendientes.map((pago) => (
                                    <li
                                        key={pago.id}
                                        className="flex items-center justify-between gap-3 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={seleccionados.includes(
                                                    pago.id,
                                                )}
                                                onChange={(e) =>
                                                    toggleSeleccionado(
                                                        pago.id,
                                                        e.target.checked,
                                                    )
                                                }
                                                className="size-4 rounded border-amber-400 text-brand-navy focus:ring-brand-navy"
                                            />
                                            <div className="text-sm">
                                                <span className="font-medium text-amber-900">
                                                    {pago.student
                                                        ? `${pago.student.first_name} ${pago.student.last_name}`
                                                        : '—'}
                                                </span>{' '}
                                                <span className="text-amber-800">
                                                    · S/{' '}
                                                    {Number(
                                                        pago.monto,
                                                    ).toFixed(2)}{' '}
                                                    ·{' '}
                                                    {
                                                        medioPagoLabels[
                                                            pago.medio
                                                        ]
                                                    }
                                                    {pago.registrado_por ===
                                                        null &&
                                                        pago.fecha_limite_pago &&
                                                        ` · límite ${formatDate(pago.fecha_limite_pago)}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <SecondaryButton
                                                onClick={() =>
                                                    rechazarPago(pago)
                                                }
                                                disabled={
                                                    rechazarForm.processing
                                                }
                                            >
                                                Rechazar
                                            </SecondaryButton>
                                            <SecondaryButton
                                                onClick={() =>
                                                    confirmarPago(pago)
                                                }
                                                disabled={
                                                    confirmForm.processing
                                                }
                                            >
                                                Aprobar
                                            </SecondaryButton>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Concepto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Modalidad
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {pagos.data.map((pago) => (
                                    <tr key={pago.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(pago.fecha)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {pago.student
                                                ? `${pago.student.first_name} ${pago.student.last_name}`
                                                : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {pago.cuota?.tipo === 'pension'
                                                ? `Pensión${pago.cuota.mes ? ` — ${pago.cuota.mes}` : ''}`
                                                : 'Matrícula'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {medioPagoLabels[pago.medio]}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-emerald-700">
                                            S/ {Number(pago.monto).toFixed(2)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <a
                                                href={route(
                                                    pago.recibo
                                                        ? 'pagos.recibo'
                                                        : 'pagos.comprobante',
                                                    pago.id,
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-brand-link hover:opacity-70"
                                                title="Ver comprobante"
                                                aria-label="Ver comprobante"
                                            >
                                                <DocumentTextIcon className="size-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {pagos.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron ingresos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={pagos.links} />
                </div>
            </div>

            <Modal
                show={creatingIngreso}
                onClose={() => setCreatingIngreso(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo ingreso manual
                    </h2>
                    <IngresoManualForm
                        onSuccess={() => setCreatingIngreso(false)}
                        onCancel={() => setCreatingIngreso(false)}
                    />
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
