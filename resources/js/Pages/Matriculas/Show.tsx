import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Cuota,
    Matricula,
    cuotaEstadoLabels,
    medioPagoLabels,
    turnoLabels,
} from '@/types/models';

const estadoBadge: Record<Cuota['estado'], string> = {
    pendiente:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    parcial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    pagado:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    vencido: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

function PagoForm({ cuota, onDone }: { cuota: Cuota; onDone: () => void }) {
    const saldo = cuota.monto_programado - cuota.monto_pagado;
    const { data, setData, post, processing, errors, reset } = useForm({
        monto: saldo.toFixed(2),
        medio: 'efectivo',
        monto_efectivo: saldo.toFixed(2),
        monto_yape: '0',
        fecha: new Date().toISOString().slice(0, 10),
        nota: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('cuotas.pagos.store', cuota.id), {
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-3 space-y-3 rounded-md border border-gray-200 p-4 dark:border-gray-700"
        >
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
                    <InputLabel htmlFor="medio" value="Modalidad de pago" />
                    <select
                        id="medio"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        value={data.medio}
                        onChange={(e) => setData('medio', e.target.value)}
                    >
                        <option value="efectivo">Efectivo</option>
                        <option value="yape">Yape</option>
                        <option value="mixto">Mixto</option>
                    </select>
                    <InputError message={errors.medio} className="mt-1" />
                </div>

                {(data.medio === 'efectivo' || data.medio === 'mixto') && (
                    <div>
                        <InputLabel
                            htmlFor="monto_efectivo"
                            value="Monto en efectivo"
                        />
                        <TextInput
                            id="monto_efectivo"
                            type="number"
                            step="0.01"
                            min={0}
                            className="mt-1 block w-full"
                            value={data.monto_efectivo}
                            onChange={(e) =>
                                setData('monto_efectivo', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.monto_efectivo}
                            className="mt-1"
                        />
                    </div>
                )}

                {(data.medio === 'yape' || data.medio === 'mixto') && (
                    <div>
                        <InputLabel htmlFor="monto_yape" value="Monto en Yape" />
                        <TextInput
                            id="monto_yape"
                            type="number"
                            step="0.01"
                            min={0}
                            className="mt-1 block w-full"
                            value={data.monto_yape}
                            onChange={(e) =>
                                setData('monto_yape', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.monto_yape}
                            className="mt-1"
                        />
                    </div>
                )}

                <div>
                    <InputLabel htmlFor="fecha" value="Fecha de pago" />
                    <TextInput
                        id="fecha"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.fecha}
                        onChange={(e) => setData('fecha', e.target.value)}
                    />
                    <InputError message={errors.fecha} className="mt-1" />
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
                    Registrar pago
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

function CuotaForm({
    matricula,
    onDone,
}: {
    matricula: Matricula;
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        mes: '',
        monto_programado: '150',
        fecha_vencimiento: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('matriculas.cuotas.store', matricula.id), {
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-3 space-y-3 rounded-md border border-gray-200 p-4 dark:border-gray-700"
        >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="mes" value="Mes" />
                    <TextInput
                        id="mes"
                        className="mt-1 block w-full"
                        placeholder="Julio 2026"
                        value={data.mes}
                        onChange={(e) => setData('mes', e.target.value)}
                    />
                    <InputError message={errors.mes} className="mt-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="monto_programado"
                        value="Monto de pensión"
                    />
                    <TextInput
                        id="monto_programado"
                        type="number"
                        step="0.01"
                        min={0}
                        className="mt-1 block w-full"
                        value={data.monto_programado}
                        onChange={(e) =>
                            setData('monto_programado', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.monto_programado}
                        className="mt-1"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="fecha_vencimiento"
                        value="Fecha de vencimiento"
                    />
                    <TextInput
                        id="fecha_vencimiento"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.fecha_vencimiento}
                        onChange={(e) =>
                            setData('fecha_vencimiento', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.fecha_vencimiento}
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Agregar cuota de pensión
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function Show({
    matricula,
    can,
}: {
    matricula: Matricula;
    can: { manage: boolean; registerPayment: boolean };
}) {
    const [payingCuota, setPayingCuota] = useState<Cuota | null>(null);
    const [addingCuota, setAddingCuota] = useState(false);
    const { delete: destroy } = useForm();

    const cuotas = matricula.cuotas ?? [];
    const totalProgramado = cuotas.reduce(
        (sum, c) => sum + Number(c.monto_programado),
        0,
    );
    const totalPagado = cuotas.reduce(
        (sum, c) => sum + Number(c.monto_pagado),
        0,
    );

    const deletePago = (cuotaId: number, pagoId: number) => {
        if (!confirm('¿Eliminar este pago? Esta acción no se puede deshacer.')) {
            return;
        }
        destroy(route('cuotas.pagos.destroy', [cuotaId, pagoId]));
    };

    const deleteCuota = (cuotaId: number) => {
        if (!confirm('¿Eliminar esta cuota?')) return;
        destroy(route('matriculas.cuotas.destroy', [matricula.id, cuotaId]));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Matrícula de {matricula.student?.first_name}{' '}
                    {matricula.student?.last_name}
                </h2>
            }
        >
            <Head title="Detalle de matrícula" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Carrera
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {matricula.carrera?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Ciclo
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {matricula.ciclo}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Turno
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {turnoLabels[matricula.turno]}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Periodo
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {matricula.period}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${estadoBadge[matricula.estado]}`}
                            >
                                {cuotaEstadoLabels[matricula.estado]}
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 text-sm sm:grid-cols-3 dark:border-gray-700">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Total programado
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    S/ {totalProgramado.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Total pagado
                                </p>
                                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                                    S/ {totalPagado.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Saldo pendiente
                                </p>
                                <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                                    S/ {(totalProgramado - totalPagado).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Cuotas
                            </h3>
                            {can.manage && !addingCuota && (
                                <SecondaryButton
                                    onClick={() => setAddingCuota(true)}
                                >
                                    Agregar cuota de pensión
                                </SecondaryButton>
                            )}
                        </div>

                        {addingCuota && (
                            <CuotaForm
                                matricula={matricula}
                                onDone={() => setAddingCuota(false)}
                            />
                        )}

                        <div className="mt-4 space-y-4">
                            {cuotas.map((cuota) => {
                                const saldo =
                                    cuota.monto_programado - cuota.monto_pagado;
                                return (
                                    <div
                                        key={cuota.id}
                                        className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {cuota.tipo === 'matricula'
                                                        ? 'Matrícula'
                                                        : `Pensión${cuota.mes ? ` — ${cuota.mes}` : ''}`}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    S/ {cuota.monto_pagado.toFixed(2)}{' '}
                                                    / S/{' '}
                                                    {cuota.monto_programado.toFixed(2)}
                                                    {cuota.fecha_vencimiento &&
                                                        ` · vence ${cuota.fecha_vencimiento}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${estadoBadge[cuota.estado]}`}
                                                >
                                                    {cuotaEstadoLabels[cuota.estado]}
                                                </span>
                                                {can.registerPayment &&
                                                    saldo > 0 && (
                                                        <SecondaryButton
                                                            onClick={() =>
                                                                setPayingCuota(
                                                                    cuota,
                                                                )
                                                            }
                                                        >
                                                            Registrar pago
                                                        </SecondaryButton>
                                                    )}
                                                {can.manage &&
                                                    cuota.tipo === 'pension' &&
                                                    cuota.monto_pagado === 0 && (
                                                        <button
                                                            onClick={() =>
                                                                deleteCuota(
                                                                    cuota.id,
                                                                )
                                                            }
                                                            className="text-sm text-red-600 hover:underline dark:text-red-400"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        {payingCuota?.id === cuota.id && (
                                            <PagoForm
                                                cuota={cuota}
                                                onDone={() =>
                                                    setPayingCuota(null)
                                                }
                                            />
                                        )}

                                        {cuota.pagos && cuota.pagos.length > 0 && (
                                            <table className="mt-3 min-w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                                                        <th className="py-1 pr-4">
                                                            Fecha
                                                        </th>
                                                        <th className="py-1 pr-4">
                                                            Monto
                                                        </th>
                                                        <th className="py-1 pr-4">
                                                            Modalidad
                                                        </th>
                                                        <th className="py-1" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {cuota.pagos.map((pago) => (
                                                        <tr key={pago.id}>
                                                            <td className="py-1 pr-4 text-gray-700 dark:text-gray-300">
                                                                {pago.fecha}
                                                            </td>
                                                            <td className="py-1 pr-4 text-gray-700 dark:text-gray-300">
                                                                S/{' '}
                                                                {pago.monto.toFixed(
                                                                    2,
                                                                )}
                                                            </td>
                                                            <td className="py-1 pr-4 text-gray-700 dark:text-gray-300">
                                                                {
                                                                    medioPagoLabels[
                                                                        pago.medio
                                                                    ]
                                                                }
                                                            </td>
                                                            <td className="py-1 text-right">
                                                                {can.manage && (
                                                                    <button
                                                                        onClick={() =>
                                                                            deletePago(
                                                                                cuota.id,
                                                                                pago.id,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:underline dark:text-red-400"
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Link
                        href={route('matriculas.index')}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                    >
                        Volver a matrículas
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
