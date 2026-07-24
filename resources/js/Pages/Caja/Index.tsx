import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { Egreso, Pago, medioPagoLabels } from '@/types/models';
import { formatDate } from '@/utils/date';

interface ResumenMes {
    mes: string;
    ingresos: number;
    egresos: number;
}

interface Stats {
    ingresosHoy: number;
    egresosHoy: number;
    ingresosMes: number;
    egresosMes: number;
}

function StatCard({
    label,
    value,
    className,
}: {
    label: string;
    value: number;
    className: string;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-lg p-4 text-center text-white shadow-sm ${className}`}
        >
            <div className="text-2xl font-bold">S/ {value.toFixed(2)}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide">
                {label}
            </div>
        </div>
    );
}

export default function Index({
    stats,
    resumenMensual,
    ultimosIngresos,
    ultimosEgresos,
}: {
    stats: Stats;
    resumenMensual: ResumenMes[];
    ultimosIngresos: Pago[];
    ultimosEgresos: Egreso[];
}) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Flujo de caja
                </h2>
            }
        >
            <Head title="Flujo de caja" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-end">
                        <Link href={route('egresos.index')}>
                            <PrimaryButton>Ver egresos</PrimaryButton>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Ingresos de hoy"
                            value={stats.ingresosHoy}
                            className="bg-emerald-500"
                        />
                        <StatCard
                            label="Egresos de hoy"
                            value={stats.egresosHoy}
                            className="bg-red-500"
                        />
                        <StatCard
                            label="Ingresos del mes"
                            value={stats.ingresosMes}
                            className="bg-sky-500"
                        />
                        <StatCard
                            label="Egresos del mes"
                            value={stats.egresosMes}
                            className="bg-orange-500"
                        />
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
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
                                            <td className="py-2 pr-4 text-sm text-emerald-700">
                                                S/ {mes.ingresos.toFixed(2)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-red-700">
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

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                            <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                                Últimos ingresos
                            </h3>
                            <ul className="divide-y divide-brand-border-faint">
                                {ultimosIngresos.map((pago) => (
                                    <li key={pago.id} className="py-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-brand-ink-strong">
                                                {pago.student
                                                    ? `${pago.student.first_name} ${pago.student.last_name}`
                                                    : '—'}
                                            </span>
                                            <span className="font-medium text-emerald-700">
                                                S/ {Number(pago.monto).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {formatDate(pago.fecha)} ·{' '}
                                            {medioPagoLabels[pago.medio]}
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

                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
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
                                            <span className="font-medium text-red-700">
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
