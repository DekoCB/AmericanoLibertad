import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageTitle from '@/Components/PageTitle';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableSelect from '@/Components/SearchableSelect';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import { CreditCardIcon, DocumentTextIcon } from '@/Components/Icons';
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

type PagoReciente = {
    id: number;
    estado: 'declarado' | 'confirmado';
    fecha: string;
    student_name: string;
    monto: number;
    saldo_restante: number | null;
    comprobante_url: string;
};

function Tabs({
    tab,
    setTab,
}: {
    tab: 'individual' | 'masivo';
    setTab: (tab: 'individual' | 'masivo') => void;
}) {
    const opciones: { value: 'individual' | 'masivo'; label: string }[] = [
        { value: 'individual', label: 'Pago individual' },
        { value: 'masivo', label: 'Pago masivo' },
    ];

    return (
        <div className="flex gap-6 border-b border-brand-border">
            {opciones.map((opcion) => {
                const activo = opcion.value === tab;
                return (
                    <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setTab(opcion.value)}
                        className={`-mb-px border-b-2 pb-3 text-sm font-bold uppercase tracking-wide transition ${
                            activo
                                ? 'border-brand-navy text-brand-ink-strong'
                                : 'border-transparent text-brand-muted hover:text-brand-ink'
                        }`}
                    >
                        {opcion.label}
                    </button>
                );
            })}
        </div>
    );
}

const estadoPagoInfo: Record<
    PagoReciente['estado'],
    { label: string; dot: string }
> = {
    confirmado: { label: 'Pagado', dot: 'bg-green-500' },
    declarado: { label: 'Por confirmar', dot: 'bg-amber-500' },
};

function PagosRecientes({ pagos }: { pagos: PagoReciente[] }) {
    return (
        <div className="rounded-lg border border-brand-border bg-brand-card p-5">
            <h3 className="font-bold text-brand-ink-strong">
                Pagos recientes
            </h3>

            {pagos.length === 0 ? (
                <p className="mt-4 text-sm text-brand-muted">
                    Todavía no hay pagos registrados.
                </p>
            ) : (
                <div className="mt-4 space-y-1">
                    {pagos.map((pago) => {
                        const info = estadoPagoInfo[pago.estado];
                        return (
                            <div
                                key={pago.id}
                                className="flex items-center justify-between gap-3 border-t border-brand-border-faint py-2.5 first:border-t-0"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={`size-2 shrink-0 rounded-full ${info.dot}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-brand-ink-strong">
                                            {pago.student_name}
                                        </p>
                                        <p className="text-xs text-brand-muted">
                                            {info.label} · {pago.fecha} · S/{' '}
                                            {pago.monto.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-brand-muted">
                                            {pago.saldo_restante === null ||
                                            pago.saldo_restante <= 0
                                                ? 'Cuota saldada'
                                                : `Saldo pendiente S/ ${pago.saldo_restante.toFixed(2)}`}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={pago.comprobante_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-brand-link hover:opacity-70"
                                    title="Ver boleta"
                                    aria-label="Ver boleta"
                                >
                                    <DocumentTextIcon className="size-5" />
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function IndividualTab({
    pendientes,
    pagosRecientes,
}: {
    pendientes: PendienteRow[];
    pagosRecientes: PagoReciente[];
}) {
    const [studentId, setStudentId] = useState('');
    const [cuotaId, setCuotaId] = useState('');
    const [dividir, setDividir] = useState(false);
    const [medio1, setMedio1] = useState('efectivo');
    const [monto1, setMonto1] = useState('');
    const [medio2, setMedio2] = useState('yape');

    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            monto: '',
            medio: 'efectivo',
            monto_efectivo: '',
            monto_yape: '0',
            fecha: new Date().toISOString().slice(0, 10),
            nota: '',
            medios: [] as { medio: string; monto: number }[],
        });

    const opcionesMedio = [
        { value: 'efectivo', label: medioPagoLabels.efectivo },
        { value: 'yape', label: medioPagoLabels.yape },
        { value: 'plin', label: medioPagoLabels.plin },
        { value: 'tarjeta', label: medioPagoLabels.tarjeta },
    ];

    const totalPago = parseFloat(data.monto) || 0;
    const monto2 = Math.max(totalPago - (parseFloat(monto1) || 0), 0);

    const estudiantes = useMemo(() => {
        const map = new Map<
            number,
            { id: number; label: string; searchText: string }
        >();
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

    const cuotaSeleccionada = cuotasDelEstudiante.find(
        (c) => String(c.cuota_id) === cuotaId,
    );

    const elegirEstudiante = (value: string) => {
        setStudentId(value);
        setCuotaId('');
        setData('monto', '');
        setData('monto_efectivo', '');
        setDividir(false);
        setMonto1('');
    };

    const elegirCuota = (value: string) => {
        setCuotaId(value);
        const row = cuotasDelEstudiante.find(
            (c) => String(c.cuota_id) === value,
        );
        if (row) {
            setData('monto', row.saldo.toFixed(2));
            setData('monto_efectivo', row.saldo.toFixed(2));
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!cuotaSeleccionada) return;

        if (dividir) {
            transform((formData) => ({
                ...formData,
                medio: 'mixto',
                medios: [
                    { medio: medio1, monto: parseFloat(monto1) || 0 },
                    { medio: medio2, monto: monto2 },
                ],
            }));
        } else {
            transform((formData) => ({ ...formData, medios: [] }));
        }

        post(route('cuotas.pagos.store', cuotaSeleccionada.cuota_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setStudentId('');
                setCuotaId('');
                setDividir(false);
                setMonto1('');
            },
        });
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                <h3 className="mb-4 font-bold text-brand-ink-strong">
                    Registrar pago
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="estudiante"
                            value="Buscar estudiante"
                        />
                        <div className="mt-1">
                            <SearchableSelect
                                value={studentId}
                                onChange={elegirEstudiante}
                                placeholder="Buscar por nombre o documento..."
                                allLabel="Selecciona un estudiante"
                                options={estudiantes.map((e) => ({
                                    value: String(e.id),
                                    label: e.label,
                                    searchText: e.searchText,
                                }))}
                            />
                        </div>
                    </div>

                    {studentId && cuotasDelEstudiante.length === 0 && (
                        <div className="sm:col-span-2">
                            <p className="rounded-lg border border-brand-border bg-brand-hover px-4 py-3 text-sm text-brand-muted">
                                Este estudiante no tiene cuotas pendientes.
                            </p>
                        </div>
                    )}

                    {cuotasDelEstudiante.length > 0 && (
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="cuota" value="Deuda" />
                            <div className="mt-1">
                                <SelectMenu
                                    id="cuota"
                                    value={cuotaId}
                                    onChange={elegirCuota}
                                    placeholder="Selecciona la cuota a pagar"
                                    options={cuotasDelEstudiante.map((c) => ({
                                        value: String(c.cuota_id),
                                        label: `${c.concepto_label} — S/ ${c.saldo.toFixed(2)}`,
                                    }))}
                                />
                            </div>
                        </div>
                    )}

                    {cuotaSeleccionada && (
                        <>
                            <div>
                                <InputLabel value="Concepto" />
                                <p className="mt-1 rounded-lg border border-brand-border bg-brand-hover px-3 py-2 text-sm text-brand-ink">
                                    {cuotaSeleccionada.concepto_label}
                                </p>
                            </div>
                            <div>
                                <InputLabel value="Carrera · Ciclo" />
                                <p className="mt-1 rounded-lg border border-brand-border bg-brand-hover px-3 py-2 text-sm text-brand-ink">
                                    {cuotaSeleccionada.carrera_name} · Ciclo{' '}
                                    {cuotaSeleccionada.ciclo}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-2 text-sm text-brand-ink">
                                    <input
                                        type="checkbox"
                                        checked={dividir}
                                        onChange={(e) => {
                                            setDividir(e.target.checked);
                                            if (e.target.checked) {
                                                setMonto1(
                                                    (totalPago / 2).toFixed(2),
                                                );
                                            }
                                        }}
                                        className="size-4 rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                                    />
                                    Dividir este pago entre 2 medios
                                </label>
                            </div>

                            {!dividir ? (
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
                                            options={opcionesMedio}
                                        />
                                    </div>
                                    <InputError
                                        message={errors.medio}
                                        className="mt-1"
                                    />
                                </div>
                            ) : (
                                <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel value="Medio 1" />
                                        <div className="mt-1">
                                            <SelectMenu
                                                value={medio1}
                                                onChange={(value) => {
                                                    setMedio1(value);
                                                    if (value === medio2) {
                                                        setMedio2(
                                                            opcionesMedio.find(
                                                                (o) =>
                                                                    o.value !==
                                                                    value,
                                                            )?.value ??
                                                                medio2,
                                                        );
                                                    }
                                                }}
                                                options={opcionesMedio}
                                            />
                                        </div>
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min={0.01}
                                            max={totalPago}
                                            className="mt-2 block w-full"
                                            value={monto1}
                                            onChange={(e) =>
                                                setMonto1(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Medio 2" />
                                        <div className="mt-1">
                                            <SelectMenu
                                                value={medio2}
                                                onChange={(value) =>
                                                    setMedio2(value)
                                                }
                                                options={opcionesMedio.filter(
                                                    (o) => o.value !== medio1,
                                                )}
                                            />
                                        </div>
                                        <p className="mt-2 rounded-lg border border-brand-border bg-brand-hover px-3 py-2 text-sm text-brand-ink">
                                            S/ {monto2.toFixed(2)}
                                        </p>
                                    </div>
                                    <InputError
                                        message={errors.medios}
                                        className="sm:col-span-2"
                                    />
                                </div>
                            )}

                            <div>
                                <InputLabel
                                    htmlFor="fecha"
                                    value="Fecha de pago"
                                />
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
                                    htmlFor="monto"
                                    value="Monto a pagar"
                                />
                                <TextInput
                                    id="monto"
                                    type="number"
                                    step="0.01"
                                    min={0.01}
                                    max={cuotaSeleccionada.saldo}
                                    className="mt-1 block w-full"
                                    value={data.monto}
                                    onChange={(e) => {
                                        setData('monto', e.target.value);
                                        setData(
                                            'monto_efectivo',
                                            e.target.value,
                                        );
                                    }}
                                />
                                <InputError
                                    message={errors.monto}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel value="Sub total" />
                                <p className="mt-1 rounded-lg border border-brand-border bg-brand-hover px-3 py-2 text-sm font-semibold text-brand-ink-strong">
                                    S/ {(parseFloat(data.monto) || 0).toFixed(2)}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
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
                        </>
                    )}
                </div>

                {cuotaSeleccionada && (
                    <PrimaryButton
                        onClick={submit}
                        disabled={processing}
                        className="mt-6"
                    >
                        Registrar pago
                    </PrimaryButton>
                )}
            </div>

            <PagosRecientes pagos={pagosRecientes} />
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
    pagosRecientes,
}: {
    carreras: Carrera[];
    pendientes: PendienteRow[];
    pagosRecientes: PagoReciente[];
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
                        <IndividualTab
                            pendientes={pendientes}
                            pagosRecientes={pagosRecientes}
                        />
                    ) : (
                        <MasivoTab carreras={carreras} pendientes={pendientes} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
