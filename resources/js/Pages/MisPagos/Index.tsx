import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageTitle from '@/Components/PageTitle';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import {
    CreditCardIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
} from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    ConfiguracionPago,
    Cuota,
    Matricula,
    Pago,
    cuotaEstadoLabels,
    medioPagoLabels,
    pagoEstadoLabels,
    turnoLabels,
} from '@/types/models';
import { formatDate } from '@/utils/date';

const estadoBadge: Record<Cuota['estado'], string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    parcial: 'bg-blue-100 text-blue-800',
    pagado: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
};

const pagoBadge: Record<Pago['estado'], string> = {
    pendiente: 'bg-amber-100 text-amber-800',
    confirmado: 'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
};

function MedioPagoInfo({
    medio,
    configuracion,
}: {
    medio: string;
    configuracion: ConfiguracionPago;
}) {
    if (medio === 'yape') {
        if (!configuracion.yape_numero && !configuracion.yape_qr_path) {
            return null;
        }

        return (
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-lg border border-brand-border bg-brand-hover p-3">
                {configuracion.yape_qr_path && (
                    <img
                        src={`/storage/${configuracion.yape_qr_path}`}
                        alt="QR de Yape"
                        className="size-24 rounded-lg border border-brand-border object-cover"
                    />
                )}
                <div className="text-sm">
                    <p className="font-semibold text-brand-ink-strong">
                        Yape
                    </p>
                    {configuracion.yape_numero && (
                        <p className="text-brand-ink">
                            {configuracion.yape_numero}
                        </p>
                    )}
                    <p className="text-brand-muted">
                        Escanea el QR o yapea al número y adjunta la captura.
                    </p>
                </div>
            </div>
        );
    }

    if (medio === 'plin') {
        if (!configuracion.plin_numero && !configuracion.plin_qr_path) {
            return null;
        }

        return (
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-lg border border-brand-border bg-brand-hover p-3">
                {configuracion.plin_qr_path && (
                    <img
                        src={`/storage/${configuracion.plin_qr_path}`}
                        alt="QR de Plin"
                        className="size-24 rounded-lg border border-brand-border object-cover"
                    />
                )}
                <div className="text-sm">
                    <p className="font-semibold text-brand-ink-strong">
                        Plin
                    </p>
                    {configuracion.plin_numero && (
                        <p className="text-brand-ink">
                            {configuracion.plin_numero}
                        </p>
                    )}
                    <p className="text-brand-muted">
                        Escanea el QR o plinea al número y adjunta la
                        captura.
                    </p>
                </div>
            </div>
        );
    }

    if (medio === 'tarjeta') {
        if (!configuracion.cuenta_detalle) {
            return null;
        }

        return (
            <div className="sm:col-span-2 rounded-lg border border-brand-border bg-brand-hover p-3 text-sm">
                <p className="mb-1 font-semibold text-brand-ink-strong">
                    Datos para transferencia
                </p>
                <p className="whitespace-pre-line text-brand-ink">
                    {configuracion.cuenta_detalle}
                </p>
            </div>
        );
    }

    return null;
}

function DeclararPagoForm({
    cuota,
    configuracion,
    onDone,
}: {
    cuota: Cuota;
    configuracion: ConfiguracionPago;
    onDone: () => void;
}) {
    const saldo = cuota.monto_programado - cuota.monto_pagado;
    const { data, setData, post, processing, errors, reset } = useForm<{
        monto: string;
        medio: string;
        monto_efectivo: string;
        monto_yape: string;
        nota: string;
        comprobante: File | null;
    }>({
        monto: saldo.toFixed(2),
        medio: 'yape',
        monto_efectivo: '0',
        monto_yape: saldo.toFixed(2),
        nota: '',
        comprobante: null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('cuotas.pagos.store', cuota.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="monto" value="Monto a pagar" />
                    <TextInput
                        id="monto"
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={saldo}
                        className="mt-1 block w-full"
                        value={data.monto}
                        onChange={(e) => setData('monto', e.target.value)}
                    />
                    <InputError message={errors.monto} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="medio" value="Medio de pago" />
                    <div className="mt-1">
                        <SelectMenu
                            id="medio"
                            value={data.medio}
                            onChange={(value) => setData('medio', value)}
                            options={[
                                { value: 'yape', label: medioPagoLabels.yape },
                                { value: 'plin', label: medioPagoLabels.plin },
                                {
                                    value: 'tarjeta',
                                    label: medioPagoLabels.tarjeta,
                                },
                                {
                                    value: 'efectivo',
                                    label: medioPagoLabels.efectivo,
                                },
                            ]}
                        />
                    </div>
                    <InputError message={errors.medio} className="mt-1" />
                </div>

                {data.medio !== 'efectivo' && (
                    <MedioPagoInfo
                        medio={data.medio}
                        configuracion={configuracion}
                    />
                )}

                {data.medio === 'efectivo' && (
                    <div
                        className="sm:col-span-2 flex items-start gap-2 rounded-lg border p-3 text-sm font-medium"
                        style={{
                            backgroundColor: 'transparent',
                            borderColor: 'var(--stat-icon-amber)',
                            color: 'var(--stat-icon-amber)',
                        }}
                    >
                        <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            Al declarar un pago en efectivo tendrás{' '}
                            <strong>7 días</strong> para acercarte a pagar en
                            la institución. Recibirás un aviso hasta que se
                            confirme.
                        </span>
                    </div>
                )}

                <div className="sm:col-span-2">
                    <InputLabel
                        htmlFor="comprobante"
                        value={
                            data.medio === 'efectivo'
                                ? 'Constancia o compromiso de pago (opcional)'
                                : 'Captura del comprobante de pago'
                        }
                    />
                    <input
                        id="comprobante"
                        type="file"
                        accept="image/*,.pdf"
                        className="mt-1 block w-full text-sm text-brand-ink"
                        onChange={(e) =>
                            setData(
                                'comprobante',
                                e.target.files?.[0] ?? null,
                            )
                        }
                    />
                    <InputError
                        message={errors.comprobante}
                        className="mt-1"
                    />
                </div>

                <div className="sm:col-span-2">
                    <InputLabel htmlFor="nota" value="Nota (opcional)" />
                    <TextInput
                        id="nota"
                        className="mt-1 block w-full"
                        value={data.nota}
                        onChange={(e) => setData('nota', e.target.value)}
                    />
                    <InputError message={errors.nota} className="mt-1" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Declarar pago
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function Index({
    matriculas,
    configuracionPagos,
}: {
    matriculas: Matricula[];
    configuracionPagos: ConfiguracionPago;
}) {
    const [payingCuota, setPayingCuota] = useState<Cuota | null>(null);

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CreditCardIcon />}>Mis pagos</PageTitle>
            }
        >
            <Head title="Mis pagos" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    {matriculas.map((matricula) => {
                        const cuotas = matricula.cuotas ?? [];
                        const totalProgramado = cuotas.reduce(
                            (sum, c) => sum + Number(c.monto_programado),
                            0,
                        );
                        const totalPagado = cuotas.reduce(
                            (sum, c) => sum + Number(c.monto_pagado),
                            0,
                        );

                        return (
                            <div
                                key={matricula.id}
                                className="space-y-4 rounded-lg border border-brand-border bg-brand-card p-6"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                                        <div>
                                            <p className="text-brand-muted">
                                                Carrera
                                            </p>
                                            <p className="font-medium text-brand-ink-strong">
                                                {matricula.carrera?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-brand-muted">
                                                Ciclo
                                            </p>
                                            <p className="font-medium text-brand-ink-strong">
                                                {matricula.ciclo}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-brand-muted">
                                                Turno
                                            </p>
                                            <p className="font-medium text-brand-ink-strong">
                                                {turnoLabels[matricula.turno]}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-brand-muted">
                                                Periodo
                                            </p>
                                            <p className="font-medium text-brand-ink-strong">
                                                {matricula.period}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-lg px-3 py-1 text-sm font-medium ${estadoBadge[matricula.estado]}`}
                                    >
                                        {cuotaEstadoLabels[matricula.estado]}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 border-t border-brand-border pt-4 text-sm sm:grid-cols-3">
                                    <div>
                                        <p className="text-brand-muted">
                                            Total programado
                                        </p>
                                        <p className="text-lg font-semibold text-brand-ink-strong">
                                            S/ {totalProgramado.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-brand-muted">
                                            Total pagado
                                        </p>
                                        <p className="text-lg font-semibold text-green-700">
                                            S/ {totalPagado.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-brand-muted">
                                            Saldo pendiente
                                        </p>
                                        <p className="text-lg font-semibold text-red-700">
                                            S/{' '}
                                            {(
                                                totalProgramado - totalPagado
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-brand-border pt-4">
                                    {cuotas.map((cuota) => {
                                        const saldo =
                                            cuota.monto_programado -
                                            cuota.monto_pagado;

                                        return (
                                            <div
                                                key={cuota.id}
                                                className="rounded-md border border-brand-border p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-brand-ink-strong">
                                                            {cuota.tipo ===
                                                            'matricula'
                                                                ? 'Matrícula'
                                                                : `Pensión${cuota.mes ? ` — ${cuota.mes}` : ''}`}
                                                        </p>
                                                        <p className="text-sm text-brand-muted">
                                                            S/{' '}
                                                            {cuota.monto_pagado.toFixed(
                                                                2,
                                                            )}{' '}
                                                            / S/{' '}
                                                            {cuota.monto_programado.toFixed(
                                                                2,
                                                            )}
                                                            {cuota.fecha_vencimiento &&
                                                                ` · vence ${formatDate(cuota.fecha_vencimiento)}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`rounded-lg px-2 py-1 text-xs font-medium ${estadoBadge[cuota.estado]}`}
                                                        >
                                                            {
                                                                cuotaEstadoLabels[
                                                                    cuota
                                                                        .estado
                                                                ]
                                                            }
                                                        </span>
                                                        {saldo > 0 && (
                                                            <SecondaryButton
                                                                onClick={() =>
                                                                    setPayingCuota(
                                                                        cuota,
                                                                    )
                                                                }
                                                            >
                                                                Declarar pago
                                                            </SecondaryButton>
                                                        )}
                                                    </div>
                                                </div>

                                                {cuota.pagos &&
                                                    cuota.pagos.length >
                                                        0 && (
                                                        <ul className="mt-3 space-y-2">
                                                            {cuota.pagos.map(
                                                                (pago) => (
                                                                    <li
                                                                        key={
                                                                            pago.id
                                                                        }
                                                                        className="flex items-center justify-between text-sm"
                                                                    >
                                                                        <div className="text-brand-ink">
                                                                            {formatDate(
                                                                                pago.fecha,
                                                                            )}{' '}
                                                                            · S/{' '}
                                                                            {pago.monto.toFixed(
                                                                                2,
                                                                            )}{' '}
                                                                            ·{' '}
                                                                            {
                                                                                medioPagoLabels[
                                                                                    pago
                                                                                        .medio
                                                                                ]
                                                                            }
                                                                            {pago.estado ===
                                                                                'pendiente' &&
                                                                                pago.fecha_limite_pago &&
                                                                                ` · límite ${formatDate(pago.fecha_limite_pago)}`}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className={`rounded-lg px-2 py-0.5 text-xs font-medium ${pagoBadge[pago.estado]}`}
                                                                            >
                                                                                {
                                                                                    pagoEstadoLabels[
                                                                                        pago
                                                                                            .estado
                                                                                    ]
                                                                                }
                                                                            </span>
                                                                            {pago.estado ===
                                                                            'confirmado' ? (
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
                                                                                    title="Ver boleta"
                                                                                    aria-label="Ver boleta"
                                                                                >
                                                                                    <DocumentTextIcon className="size-4" />
                                                                                </a>
                                                                            ) : (
                                                                                pago.comprobante_path && (
                                                                                    <a
                                                                                        href={route(
                                                                                            'pagos.comprobante-adjunto',
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
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    )}
                                            </div>
                                        );
                                    })}
                                    {cuotas.length === 0 && (
                                        <p className="text-sm text-brand-muted">
                                            No hay cuotas registradas.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {matriculas.length === 0 && (
                        <div className="rounded-lg border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No tienes matrículas registradas.
                        </div>
                    )}
                </div>
            </div>

            <Modal
                show={payingCuota !== null}
                onClose={() => setPayingCuota(null)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Declarar pago
                    </h2>
                    {payingCuota && (
                        <DeclararPagoForm
                            cuota={payingCuota}
                            configuracion={configuracionPagos}
                            onDone={() => setPayingCuota(null)}
                        />
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
