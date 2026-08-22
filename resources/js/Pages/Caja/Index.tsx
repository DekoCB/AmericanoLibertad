import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import PageTitle from '@/Components/PageTitle';
import { BanknotesIcon, ArrowTrendingUpIcon } from '@/Components/Icons';
import { Head, Link } from '@inertiajs/react';
import { Egreso } from '@/types/models';
import { formatDate } from '@/utils/date';

interface ResumenMes {
    mes: string;
    ingresos: number;
    egresos: number;
}

interface CategoriasMes {
    ingresos: {
        matricula: number;
        pension: number;
        donacion: number;
        servicio: number;
        otro: number;
    };
    egresos: {
        pago_docente: number;
        operativo: number;
        otro: number;
    };
}

const ingresoCategoriaLabels: Record<
    keyof CategoriasMes['ingresos'],
    string
> = {
    matricula: 'Matrícula',
    pension: 'Pensión',
    donacion: 'Donación',
    servicio: 'Servicio',
    otro: 'Otro',
};

const egresoCategoriaLabelsCaja: Record<
    keyof CategoriasMes['egresos'],
    string
> = {
    pago_docente: 'Pago a docente',
    operativo: 'Operativo',
    otro: 'Otro',
};

function CategoriaBar({
    label,
    value,
    max,
    color,
}: {
    label: string;
    value: number;
    max: number;
    color: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;

    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-brand-ink">{label}</span>
                <span className="font-medium text-brand-ink-strong">
                    S/ {value.toFixed(2)}
                </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-hover">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

interface Stats {
    ingresosHoy: number;
    egresosHoy: number;
    ingresosMes: number;
    egresosMes: number;
}

interface IngresoReciente {
    tipo: 'pago' | 'manual';
    id: number;
    fecha: string;
    descripcion: string;
    monto: number;
}

function StatCard({
    label,
    value,
    trend,
}: {
    label: string;
    value: number;
    trend: 'in' | 'out';
}) {
    const color = trend === 'in' ? 'var(--money-in)' : 'var(--money-out)';

    return (
        <div
            className="flex items-center gap-3 rounded-lg border bg-brand-card p-[18px_20px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <ArrowTrendingUpIcon
                className={`size-6 shrink-0 ${trend === 'out' ? 'rotate-180' : ''}`}
                style={{ color }}
            />
            <div>
                <div
                    className="text-xl font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    S/ {value.toFixed(2)}
                </div>
                <div
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--brand-muted)' }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}

export default function Index({
    stats,
    resumenMensual,
    categoriasMes,
    ultimosIngresos,
    ultimosEgresos,
}: {
    stats: Stats;
    resumenMensual: ResumenMes[];
    categoriasMes: CategoriasMes;
    ultimosIngresos: IngresoReciente[];
    ultimosEgresos: Egreso[];
}) {
    const maxIngreso = Math.max(
        1,
        ...Object.values(categoriasMes.ingresos),
    );
    const maxEgreso = Math.max(1, ...Object.values(categoriasMes.egresos));
    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<BanknotesIcon />}>Flujo de caja</PageTitle>
            }
        >
            <Head title="Flujo de caja" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('ingresos.index')}>
                            <PrimaryButton>Ver ingresos</PrimaryButton>
                        </Link>
                        <Link href={route('egresos.index')}>
                            <PrimaryButton>Ver egresos</PrimaryButton>
                        </Link>
                        <Link href={route('ingresos-manuales.index')}>
                            <PrimaryButton>Otros ingresos</PrimaryButton>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Ingresos de hoy"
                            value={stats.ingresosHoy}
                            trend="in"
                        />
                        <StatCard
                            label="Egresos de hoy"
                            value={stats.egresosHoy}
                            trend="out"
                        />
                        <StatCard
                            label="Ingresos del mes"
                            value={stats.ingresosMes}
                            trend="in"
                        />
                        <StatCard
                            label="Egresos del mes"
                            value={stats.egresosMes}
                            trend="out"
                        />
                    </div>

                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                            Resumen mensual
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        <th className="py-2 pr-4">Mes</th>
                                        <th className="py-2 pr-4">Ingresos</th>
                                        <th className="py-2 pr-4">Egresos</th>
                                        <th className="py-2">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {resumenMensual.map((mes) => (
                                        <tr key={mes.mes}>
                                            <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                {mes.mes}
                                            </td>
                                            <td
                                                className="py-2 pr-4 text-sm"
                                                style={{ color: 'var(--money-in)' }}
                                            >
                                                S/ {mes.ingresos.toFixed(2)}
                                            </td>
                                            <td
                                                className="py-2 pr-4 text-sm"
                                                style={{ color: 'var(--money-out)' }}
                                            >
                                                S/ {mes.egresos.toFixed(2)}
                                            </td>
                                            <td className="py-2 text-sm font-medium text-brand-ink-strong">
                                                S/{' '}
                                                {(
                                                    mes.ingresos - mes.egresos
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {resumenMensual.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                Sin movimientos registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                            Ingresos y egresos por categoría (mes actual)
                        </h3>
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <div className="space-y-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                                    Ingresos
                                </div>
                                {(
                                    Object.keys(
                                        ingresoCategoriaLabels,
                                    ) as (keyof CategoriasMes['ingresos'])[]
                                ).map((key) => (
                                    <CategoriaBar
                                        key={key}
                                        label={ingresoCategoriaLabels[key]}
                                        value={categoriasMes.ingresos[key]}
                                        max={maxIngreso}
                                        color="var(--money-in)"
                                    />
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                                    Egresos
                                </div>
                                {(
                                    Object.keys(
                                        egresoCategoriaLabelsCaja,
                                    ) as (keyof CategoriasMes['egresos'])[]
                                ).map((key) => (
                                    <CategoriaBar
                                        key={key}
                                        label={egresoCategoriaLabelsCaja[key]}
                                        value={categoriasMes.egresos[key]}
                                        max={maxEgreso}
                                        color="var(--money-out)"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                            <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                                Últimos ingresos
                            </h3>
                            <ul className="divide-y divide-brand-border-faint">
                                {ultimosIngresos.map((ingreso) => (
                                    <li
                                        key={`${ingreso.tipo}-${ingreso.id}`}
                                        className="py-2"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-brand-ink-strong">
                                                {ingreso.descripcion}
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: 'var(--money-in)' }}
                                            >
                                                S/{' '}
                                                {Number(ingreso.monto).toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {formatDate(ingreso.fecha)}
                                            {ingreso.tipo === 'manual' &&
                                                ' · Otro ingreso'}
                                        </div>
                                    </li>
                                ))}
                                {ultimosIngresos.length === 0 && (
                                    <li className="py-2 text-sm text-brand-muted">
                                        Sin ingresos registrados.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                            <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                                Últimos egresos
                            </h3>
                            <ul className="divide-y divide-brand-border-faint">
                                {ultimosEgresos.map((egreso) => (
                                    <li key={egreso.id} className="py-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-brand-ink-strong">
                                                {egreso.concepto}
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: 'var(--money-out)' }}
                                            >
                                                S/{' '}
                                                {Number(egreso.monto).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {formatDate(egreso.fecha)}
                                        </div>
                                    </li>
                                ))}
                                {ultimosEgresos.length === 0 && (
                                    <li className="py-2 text-sm text-brand-muted">
                                        Sin egresos registrados.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
