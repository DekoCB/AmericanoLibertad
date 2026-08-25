import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PagoForm from '@/Components/PagoForm';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { DocumentTextIcon, PencilIcon, TrashIcon } from '@/Components/Icons';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Cuota,
    Matricula,
    cuotaEstadoLabels,
    medioPagoLabels,
    turnoLabels,
} from '@/types/models';
import { formatDate, formatDateTime } from '@/utils/date';

const estadoBadge: Record<Cuota['estado'], string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    parcial: 'bg-blue-100 text-blue-800',
    pagado: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
};

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
        <form onSubmit={submit} className="space-y-3">
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
                    <DateInput
                        id="fecha_vencimiento"
                        className="mt-1 block w-full"
                        value={data.fecha_vencimiento}
                        onChange={(v) => setData('fecha_vencimiento', v)}
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

function EditMatriculaForm({
    matricula,
    onDone,
}: {
    matricula: Matricula;
    onDone: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        ciclo: String(matricula.ciclo),
        turno: matricula.turno,
        period: matricula.period,
        monto_matricula: String(matricula.monto_matricula),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('matriculas.update', matricula.id), {
            onSuccess: onDone,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                    <TextInput
                        id="ciclo"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.ciclo}
                        onChange={(e) => setData('ciclo', e.target.value)}
                    />
                    <InputError message={errors.ciclo} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="turno" value="Turno" />
                    <div className="mt-1">
                        <SelectMenu
                            id="turno"
                            value={data.turno}
                            onChange={(value) =>
                                setData(
                                    'turno',
                                    value as Matricula['turno'],
                                )
                            }
                            options={Object.entries(turnoLabels).map(
                                ([value, label]) => ({ value, label }),
                            )}
                        />
                    </div>
                    <InputError message={errors.turno} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="period" value="Periodo" />
                    <TextInput
                        id="period"
                        className="mt-1 block w-full"
                        value={data.period}
                        onChange={(e) => setData('period', e.target.value)}
                    />
                    <InputError message={errors.period} className="mt-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="monto_matricula"
                        value="Monto de matrícula"
                    />
                    <TextInput
                        id="monto_matricula"
                        type="number"
                        step="0.01"
                        min={0}
                        className="mt-1 block w-full"
                        value={data.monto_matricula}
                        onChange={(e) =>
                            setData('monto_matricula', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.monto_matricula}
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Guardar cambios
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function MatriculaDetail({
    matricula,
    can,
}: {
    matricula: Matricula;
    can: { manage: boolean; registerPayment: boolean };
}) {
    const [payingCuota, setPayingCuota] = useState<Cuota | null>(null);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [addingCuota, setAddingCuota] = useState(false);
    const [editingMatricula, setEditingMatricula] = useState(false);
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

    const quitarMatriculaCurso = (courseId: number, enrollmentId: number) => {
        if (!confirm('¿Quitar esta matrícula de la sección?')) return;
        destroy(route('courses.enrollments.destroy', [courseId, enrollmentId]));
    };

    return (
        <div className="space-y-6">
            <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                        <div>
                            <p className="text-brand-muted">Carrera</p>
                            <p className="font-medium text-brand-ink-strong">
                                {matricula.carrera?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-brand-muted">Ciclo</p>
                            <p className="font-medium text-brand-ink-strong">
                                {matricula.ciclo}
                            </p>
                        </div>
                        <div>
                            <p className="text-brand-muted">Turno</p>
                            <p className="font-medium text-brand-ink-strong">
                                {turnoLabels[matricula.turno]}
                            </p>
                        </div>
                        <div>
                            <p className="text-brand-muted">Periodo</p>
                            <p className="font-medium text-brand-ink-strong">
                                {matricula.period}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className={`rounded-lg px-3 py-1 text-sm font-medium ${estadoBadge[matricula.estado]}`}
                        >
                            {cuotaEstadoLabels[matricula.estado]}
                        </span>
                        {can.manage && (
                            <button
                                type="button"
                                onClick={() => setEditingMatricula(true)}
                                className="text-brand-link hover:opacity-70"
                                title="Editar matrícula"
                                aria-label="Editar matrícula"
                            >
                                <PencilIcon className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-brand-border pt-4 text-sm sm:grid-cols-3">
                    <div>
                        <p className="text-brand-muted">Total programado</p>
                        <p className="text-lg font-semibold text-brand-ink-strong">
                            S/ {totalProgramado.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-brand-muted">Total pagado</p>
                        <p className="text-lg font-semibold text-green-700">
                            S/ {totalPagado.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-brand-muted">Saldo pendiente</p>
                        <p className="text-lg font-semibold text-red-700">
                            S/ {(totalProgramado - totalPagado).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {matricula.materias && matricula.materias.length > 0 && (
                <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Cursos y profesores asignados
                    </h3>
                    <div className="mt-4 overflow-hidden overflow-x-auto rounded-lg border border-brand-border-faint">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Curso
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Sección
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Profesor
                                    </th>
                                    {can.manage && <th className="px-4 py-2" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {matricula.materias.map((materia, index) => (
                                    <tr key={index}>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-brand-ink-strong">
                                            {materia.subject}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-brand-ink">
                                            {materia.course}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-brand-ink">
                                            {materia.teacher ?? 'Sin docente'}
                                        </td>
                                        {can.manage && (
                                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                                                <button
                                                    onClick={() =>
                                                        quitarMatriculaCurso(
                                                            materia.course_id,
                                                            materia.enrollment_id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:opacity-70"
                                                    title="Quitar de la sección"
                                                    aria-label="Quitar de la sección"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Cuotas
                    </h3>
                    {can.manage && !addingCuota && (
                        <SecondaryButton onClick={() => setAddingCuota(true)}>
                            Agregar cuota de pensión
                        </SecondaryButton>
                    )}
                </div>

                <div className="mt-4 space-y-4">
                    {cuotas.map((cuota) => {
                        const saldo =
                            cuota.monto_programado - cuota.monto_pagado;
                        return (
                            <div
                                key={cuota.id}
                                className="rounded-md border border-brand-border p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-brand-ink-strong">
                                            {cuota.tipo === 'matricula'
                                                ? 'Matrícula'
                                                : `Pensión${cuota.mes ? ` — ${cuota.mes}` : ''}`}
                                        </p>
                                        <p className="text-sm text-brand-muted">
                                            S/ {cuota.monto_pagado.toFixed(2)}{' '}
                                            / S/{' '}
                                            {cuota.monto_programado.toFixed(2)}
                                            {cuota.fecha_vencimiento &&
                                                ` · vence ${formatDate(cuota.fecha_vencimiento)}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`rounded-lg px-2 py-1 text-xs font-medium ${estadoBadge[cuota.estado]}`}
                                        >
                                            {cuotaEstadoLabels[cuota.estado]}
                                        </span>
                                        {can.registerPayment &&
                                            saldo > 0 && (
                                                <SecondaryButton
                                                    onClick={() => {
                                                        setPayingCuota(cuota);
                                                        setPayModalOpen(true);
                                                    }}
                                                >
                                                    Registrar pago
                                                </SecondaryButton>
                                            )}
                                        {can.manage &&
                                            cuota.tipo === 'pension' &&
                                            cuota.monto_pagado === 0 && (
                                                <button
                                                    onClick={() =>
                                                        deleteCuota(cuota.id)
                                                    }
                                                    className="text-sm text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            )}
                                    </div>
                                </div>

                                {cuota.pagos && cuota.pagos.length > 0 && (
                                    <table className="mt-3 min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-brand-muted">
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
                                        <tbody className="divide-y divide-brand-border-faint">
                                            {cuota.pagos.map((pago) => (
                                                <tr key={pago.id}>
                                                    <td className="py-1 pr-4 text-brand-ink">
                                                        {formatDate(pago.fecha)}
                                                    </td>
                                                    <td className="py-1 pr-4 text-brand-ink">
                                                        S/{' '}
                                                        {pago.monto.toFixed(2)}
                                                    </td>
                                                    <td className="py-1 pr-4 text-brand-ink">
                                                        {
                                                            medioPagoLabels[
                                                                pago.medio
                                                            ]
                                                        }
                                                    </td>
                                                    <td className="py-1 text-right">
                                                        <a
                                                            href={route(
                                                                'pagos.comprobante',
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
                                                        {can.manage && (
                                                            <button
                                                                onClick={() =>
                                                                    deletePago(
                                                                        cuota.id,
                                                                        pago.id,
                                                                    )
                                                                }
                                                                className="ms-3 text-red-600 hover:opacity-70"
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
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {matricula.historiales && matricula.historiales.length > 0 && (
                <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                    <h3 className="text-lg font-bold text-brand-ink-strong">
                        Historial de cambios
                    </h3>
                    <ul className="mt-4 space-y-3">
                        {matricula.historiales.map((cambio) => (
                            <li
                                key={cambio.id}
                                className="rounded-md border border-brand-border p-3 text-sm"
                            >
                                <p className="text-brand-ink">
                                    <span className="font-medium text-brand-ink-strong">
                                        {cambio.campo}
                                    </span>
                                    : {cambio.valor_anterior ?? '—'} →{' '}
                                    {cambio.valor_nuevo ?? '—'}
                                </p>
                                <p className="mt-1 text-xs text-brand-muted-soft">
                                    {cambio.user?.name ?? 'Sistema'} ·{' '}
                                    {formatDateTime(cambio.created_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Modal
                show={editingMatricula}
                onClose={() => setEditingMatricula(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar matrícula
                    </h2>
                    <EditMatriculaForm
                        matricula={matricula}
                        onDone={() => setEditingMatricula(false)}
                    />
                </div>
            </Modal>

            <Modal show={addingCuota} onClose={() => setAddingCuota(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Agregar cuota de pensión
                    </h2>
                    <CuotaForm
                        matricula={matricula}
                        onDone={() => setAddingCuota(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={payModalOpen}
                onClose={() => setPayModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Registrar pago
                    </h2>
                    {payingCuota && (
                        <PagoForm
                            cuota={payingCuota}
                            onDone={() => setPayModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
