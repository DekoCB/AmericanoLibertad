import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageTitle from '@/Components/PageTitle';
import PagoForm from '@/Components/PagoForm';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableSelect from '@/Components/SearchableSelect';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import { CreditCardIcon } from '@/Components/Icons';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { medioPagoLabels } from '@/types/models';
import { PageProps } from '@/types';

type PendienteRow = {
    cuota_id: number;
    matricula_id: number;
    student_id: number;
    student_name: string;
    document_number: string;
    carrera_id: number;
    carrera_name: string;
    ciclo: number;
    concepto_value: string;
    concepto_label: string;
    saldo: number;
};

type Carrera = { id: number; name: string };

function Tabs({
    tab,
    setTab,
}: {
    tab: 'individual' | 'masivo';
    setTab: (tab: 'individual' | 'masivo') => void;
}) {
    const opciones: { value: 'individual' | 'masivo'; label: string }[] = [
        { value: 'individual', label: 'Individual' },
        { value: 'masivo', label: 'Masivo' },
    ];

    return (
        <div className="flex gap-2">
            {opciones.map((opcion) => {
                const activo = opcion.value === tab;
                return (
                    <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setTab(opcion.value)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition"
                        style={{
                            background: activo
                                ? 'var(--brand-navy)'
                                : 'var(--brand-hover)',
                            color: activo ? '#fff' : 'var(--brand-muted)',
                        }}
                    >
                        {opcion.label}
                    </button>
                );
            })}
        </div>
    );
}

function IndividualTab({ pendientes }: { pendientes: PendienteRow[] }) {
    const [studentId, setStudentId] = useState('');
    const [payingCuota, setPayingCuota] = useState<PendienteRow | null>(null);

    const estudiantes = useMemo(() => {
        const map = new Map<number, { id: number; label: string; searchText: string }>();
        pendientes.forEach((p) => {
            if (!map.has(p.student_id)) {
                map.set(p.student_id, {
                    id: p.student_id,
                    label: `${p.student_name} — ${p.document_number}`,
                    searchText: `${p.student_name} ${p.document_number}`,
                });
            }
        });
        return Array.from(map.values()).sort((a, b) =>
            a.label.localeCompare(b.label),
        );
    }, [pendientes]);

    const cuotasDelEstudiante = useMemo(
        () =>
            studentId
                ? pendientes.filter((p) => String(p.student_id) === studentId)
                : [],
        [pendientes, studentId],
    );

    return (
        <div className="space-y-4">
            <div className="max-w-sm">
                <SearchableSelect
                    value={studentId}
                    onChange={setStudentId}
                    placeholder="Buscar estudiante por nombre o documento..."
                    allLabel="Selecciona un estudiante"
                    options={estudiantes.map((e) => ({
                        value: String(e.id),
                        label: e.label,
                        searchText: e.searchText,
                    }))}
                />
            </div>

            {studentId && cuotasDelEstudiante.length === 0 && (
                <div className="rounded-lg border border-brand-border bg-brand-card p-6 text-center text-sm text-brand-muted">
                    Este estudiante no tiene cuotas pendientes.
                </div>
            )}

            {cuotasDelEstudiante.length > 0 && (
                <div className="grid grid-cols-1 border-l border-t border-brand-border sm:grid-cols-2 lg:grid-cols-3">
                    {cuotasDelEstudiante.map((row) => (
                        <button
                            key={row.cuota_id}
                            type="button"
                            onClick={() => setPayingCuota(row)}
                            className="border-b border-r border-brand-border bg-brand-card p-5 text-left transition hover:bg-brand-hover"
                        >
                            <p className="font-medium text-brand-ink-strong">
                                {row.concepto_label}
                            </p>
                            <p className="mt-1 text-xs text-brand-muted">
                                {row.carrera_name} · Ciclo {row.ciclo}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-brand-ink-strong">
                                S/ {row.saldo.toFixed(2)}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            <Modal
                show={payingCuota !== null}
                onClose={() => setPayingCuota(null)}
            >
                <div className="p-6">
                    <h2 className="mb-1 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Registrar pago
                    </h2>
                    {payingCuota && (
                        <>
                            <p className="mb-6 text-center text-sm text-brand-muted">
                                {payingCuota.student_name} ·{' '}
                                {payingCuota.concepto_label}
                            </p>
                            <PagoForm
                                cuota={{
                                    id: payingCuota.cuota_id,
                                    monto_programado: payingCuota.saldo,
                                    monto_pagado: 0,
                                }}
                                onDone={() => setPayingCuota(null)}
                            />
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function MasivoTab({
    carreras,
    pendientes,
}: {
    carreras: Carrera[];
    pendientes: PendienteRow[];
}) {
    const [carreraId, setCarreraId] = useState('');
    const [ciclo, setCiclo] = useState('');
    const [concepto, setConcepto] = useState('');
    const [seleccion, setSeleccion] = useState<
        Record<number, { checked: boolean; monto: string }>
    >({});

    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            pagos: [] as { cuota_id: number; monto: number }[],
            medio: 'efectivo',
            fecha: new Date().toISOString().slice(0, 10),
            nota: '',
        });

    const ciclosDisponibles = useMemo(
        () =>
            [
                ...new Set(
                    pendientes
                        .filter((p) => String(p.carrera_id) === carreraId)
                        .map((p) => p.ciclo),
                ),
            ].sort((a, b) => a - b),
        [pendientes, carreraId],
    );

    const conceptosDisponibles = useMemo(() => {
        const map = new Map<string, string>();
        pendientes
            .filter(
                (p) =>
                    String(p.carrera_id) === carreraId &&
                    String(p.ciclo) === ciclo,
            )
            .forEach((p) => map.set(p.concepto_value, p.concepto_label));
        return Array.from(map.entries()).map(([value, label]) => ({
            value,
            label,
        }));
    }, [pendientes, carreraId, ciclo]);

    const filas = useMemo(
        () =>
            carreraId && ciclo && concepto
                ? pendientes.filter(
                      (p) =>
                          String(p.carrera_id) === carreraId &&
                          String(p.ciclo) === ciclo &&
                          p.concepto_value === concepto,
                  )
                : [],
        [pendientes, carreraId, ciclo, concepto],
    );

    const toggleFila = (row: PendienteRow, checked: boolean) => {
        setSeleccion((prev) => ({
            ...prev,
            [row.cuota_id]: {
                checked,
                monto: prev[row.cuota_id]?.monto ?? row.saldo.toFixed(2),
            },
        }));
    };

    const cambiarMonto = (cuotaId: number, monto: string) => {
        setSeleccion((prev) => ({
            ...prev,
            [cuotaId]: { checked: prev[cuotaId]?.checked ?? false, monto },
        }));
    };

    const filasMarcadas = filas.filter(
        (row) => seleccion[row.cuota_id]?.checked,
    );
    const total = filasMarcadas.reduce(
        (sum, row) =>
            sum + (parseFloat(seleccion[row.cuota_id]?.monto ?? '0') || 0),
        0,
    );

    const submit = (e: FormEvent) => {
        e.preventDefault();

        transform((formData) => ({
            ...formData,
            pagos: filasMarcadas.map((row) => ({
                cuota_id: row.cuota_id,
                monto: parseFloat(seleccion[row.cuota_id]?.monto ?? '0') || 0,
            })),
        }));

        post(route('pagos.masivo'), {
            preserveScroll: true,
            onSuccess: () => {
                setSeleccion({});
                reset('nota');
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="carrera" value="Carrera" />
                    <div className="mt-1">
                        <SelectMenu
                            id="carrera"
                            value={carreraId}
                            onChange={(value) => {
                                setCarreraId(value);
                                setCiclo('');
                                setConcepto('');
                                setSeleccion({});
                            }}
                            placeholder="Selecciona una carrera"
                            options={carreras.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                            }))}
                        />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                    <div className="mt-1">
                        <SelectMenu
                            id="ciclo"
                            value={ciclo}
                            onChange={(value) => {
                                setCiclo(value);
                                setConcepto('');
                                setSeleccion({});
                            }}
                            placeholder={
                                carreraId
                                    ? 'Selecciona un ciclo'
                                    : 'Elige una carrera primero'
                            }
                            options={ciclosDisponibles.map((c) => ({
                                value: String(c),
                                label: `Ciclo ${c}`,
                            }))}
                        />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="concepto" value="Concepto" />
                    <div className="mt-1">
                        <SelectMenu
                            id="concepto"
                            value={concepto}
                            onChange={(value) => {
                                setConcepto(value);
                                setSeleccion({});
                            }}
                            placeholder={
                                ciclo
                                    ? 'Selecciona un concepto'
                                    : 'Elige un ciclo primero'
                            }
                            options={conceptosDisponibles}
                        />
                    </div>
                </div>
            </div>

            {carreraId && ciclo && concepto && filas.length === 0 && (
                <div className="rounded-lg border border-brand-border bg-brand-card p-6 text-center text-sm text-brand-muted">
                    No hay estudiantes con este concepto pendiente en ese
                    grupo.
                </div>
            )}

            {filas.length > 0 && (
                <>
                    <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3" />
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Documento
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Saldo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Monto a pagar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {filas.map((row) => {
                                    const fila = seleccion[row.cuota_id];
                                    return (
                                        <tr key={row.cuota_id}>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        fila?.checked ?? false
                                                    }
                                                    onChange={(e) =>
                                                        toggleFila(
                                                            row,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="size-4 rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                                {row.student_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {row.document_number}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                S/ {row.saldo.toFixed(2)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <TextInput
                                                    type="number"
                                                    step="0.01"
                                                    min={0.01}
                                                    max={row.saldo}
                                                    disabled={!fila?.checked}
                                                    className="block w-28"
                                                    value={
                                                        fila?.monto ??
                                                        row.saldo.toFixed(2)
                                                    }
                                                    onChange={(e) =>
                                                        cambiarMonto(
                                                            row.cuota_id,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-brand-border bg-brand-card p-4 sm:grid-cols-3">
                        <div>
                            <InputLabel
                                htmlFor="medio"
                                value="Medio de pago"
                            />
                            <div className="mt-1">
                                <SelectMenu
                                    id="medio"
                                    value={data.medio}
                                    onChange={(value) =>
                                        setData('medio', value)
                                    }
                                    options={[
                                        {
                                            value: 'efectivo',
                                            label: medioPagoLabels.efectivo,
                                        },
                                        {
                                            value: 'yape',
                                            label: medioPagoLabels.yape,
                                        },
                                        {
                                            value: 'plin',
                                            label: medioPagoLabels.plin,
                                        },
                                        {
                                            value: 'tarjeta',
                                            label: medioPagoLabels.tarjeta,
                                        },
                                    ]}
                                />
                            </div>
                            <InputError
                                message={errors.medio}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="fecha" value="Fecha" />
                            <DateInput
                                id="fecha"
                                className="mt-1 block w-full"
                                value={data.fecha}
                                onChange={(v) => setData('fecha', v)}
                            />
                            <InputError
                                message={errors.fecha}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="nota"
                                value="Nota (opcional)"
                            />
                            <TextInput
                                id="nota"
                                className="mt-1 block w-full"
                                value={data.nota}
                                onChange={(e) =>
                                    setData('nota', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <InputError message={errors.pagos} className="mt-1" />

                    <PrimaryButton
                        disabled={processing || filasMarcadas.length === 0}
                    >
                        {filasMarcadas.length === 0
                            ? 'Marca al menos un estudiante'
                            : `Registrar ${filasMarcadas.length} pago${filasMarcadas.length === 1 ? '' : 's'} — S/ ${total.toFixed(2)}`}
                    </PrimaryButton>
                </>
            )}
        </form>
    );
}

export default function Index({
    carreras,
    pendientes,
}: {
    carreras: Carrera[];
    pendientes: PendienteRow[];
}) {
    const [tab, setTab] = useState<'individual' | 'masivo'>('individual');
    const { flash } = usePage<PageProps>().props;

    return (
        <AuthenticatedLayout
            header={<PageTitle icon={<CreditCardIcon />}>Pagos</PageTitle>}
        >
            <Head title="Pagos" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-800">
                            {flash.error}
                        </div>
                    )}

                    <Tabs tab={tab} setTab={setTab} />

                    {tab === 'individual' ? (
                        <IndividualTab pendientes={pendientes} />
                    ) : (
                        <MasivoTab carreras={carreras} pendientes={pendientes} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
