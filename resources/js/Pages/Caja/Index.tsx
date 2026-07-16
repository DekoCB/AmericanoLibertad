import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { Egreso, Pago, medioPagoLabels } from '@/types/models';

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Flujo de caja
                </h2>
            }
        >
            <Head title="Flujo de caja" />

            <div className="py-12">
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

                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                            Resumen mensual
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        <th className="py-2 pr-4">Mes</th>
                                        <th className="py-2 pr-4">Ingresos</th>
                                        <th className="py-2 pr-4">Egresos</th>
                                        <th className="py-2">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {resumenMensual.map((mes) => (
                                        <tr key={mes.mes}>
                                            <td className="py-2 pr-4 text-sm text-gray-900 dark:text-gray-100">
                                                {mes.mes}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-emerald-700 dark:text-emerald-400">
                                                S/ {mes.ingresos.toFixed(2)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-red-700 dark:text-red-400">
                                                S/ {mes.egresos.toFixed(2)}
                                            </td>
                                            <td className="py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
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
                                                className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
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
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Últimos ingresos
                            </h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {ultimosIngresos.map((pago) => (
                                    <li key={pago.id} className="py-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {pago.student
                                                    ? `${pago.student.first_name} ${pago.student.last_name}`
                                                    : '—'}
                                            </span>
                                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                                S/ {Number(pago.monto).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {pago.fecha} ·{' '}
                                            {medioPagoLabels[pago.medio]}
                                        </div>
                                    </li>
                                ))}
                                {ultimosIngresos.length === 0 && (
                                    <li className="py-2 text-sm text-gray-500 dark:text-gray-400">
                                        Sin ingresos registrados.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Últimos egresos
                            </h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {ultimosEgresos.map((egreso) => (
                                    <li key={egreso.id} className="py-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {egreso.concepto}
                                            </span>
                                            <span className="font-medium text-red-700 dark:text-red-400">
                                                S/{' '}
                                                {Number(egreso.monto).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {egreso.fecha}
                                        </div>
                                    </li>
                                ))}
                                {ultimosEgresos.length === 0 && (
                                    <li className="py-2 text-sm text-gray-500 dark:text-gray-400">
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
