import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import { ArrowDownTrayIcon, ArrowTrendingUpIcon } from '@/Components/Icons';
import { Head } from '@inertiajs/react';

interface IngresoPeriodo {
    periodo: string;
    cantidad: number;
    total: number;
}

interface MoraCarrera {
    carrera: string;
    cuotas_vencidas: number;
    monto_vencido: number;
}

interface ProyeccionPeriodo {
    periodo: string;
    cuotas: number;
    monto_esperado: number;
}

export default function Index({
    ingresosPorPeriodo,
    moraPorCarrera,
    proyeccionCobranza,
}: {
    ingresosPorPeriodo: IngresoPeriodo[];
    moraPorCarrera: MoraCarrera[];
    proyeccionCobranza: ProyeccionPeriodo[];
}) {
    const totalMora = moraPorCarrera.reduce(
        (sum, fila) => sum + fila.monto_vencido,
        0,
    );
    const totalProyectado = proyeccionCobranza.reduce(
        (sum, fila) => sum + fila.monto_esperado,
        0,
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <PageTitle icon={<ArrowTrendingUpIcon />}>
                        Reportes financieros
                    </PageTitle>
                    <a
                        href={route('reportes.exportar')}
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-xs font-semibold uppercase tracking-widest text-brand-ink transition hover:bg-brand-hover"
                    >
                        <ArrowDownTrayIcon className="size-4" />
                        Descargar Excel
                    </a>
                </div>
            }
        >
            <Head title="Reportes financieros" />

            <div className="bg-brand-cream min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            Ingresos por período
                        </h3>
                        <p className="mt-1 text-sm text-brand-muted">
                            Pagos de matrícula y pensión, agrupados por mes.
                        </p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        <th className="py-2 pr-4">Período</th>
                                        <th className="py-2 pr-4">
                                            Cantidad de pagos
                                        </th>
                                        <th className="py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {ingresosPorPeriodo.map((fila) => (
                                        <tr key={fila.periodo}>
                                            <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                {fila.periodo}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {fila.cantidad}
                                            </td>
                                            <td className="py-2 text-sm font-medium text-emerald-700">
                                                S/ {fila.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {ingresosPorPeriodo.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                Sin pagos registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Mora por carrera
                            </h3>
                            <span className="text-sm font-medium text-red-700">
                                Total vencido: S/ {totalMora.toFixed(2)}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-brand-muted">
                            Cuotas con estado "vencido", agrupadas por carrera.
                        </p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        <th className="py-2 pr-4">Carrera</th>
                                        <th className="py-2 pr-4">
                                            Cuotas vencidas
                                        </th>
                                        <th className="py-2">
                                            Monto vencido
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {moraPorCarrera.map((fila) => (
                                        <tr key={fila.carrera}>
                                            <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                {fila.carrera}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {fila.cuotas_vencidas}
                                            </td>
                                            <td className="py-2 text-sm font-medium text-red-700">
                                                S/{' '}
                                                {fila.monto_vencido.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {moraPorCarrera.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                No hay carreras registradas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Proyección de cobranza
                            </h3>
                            <span className="text-sm font-medium text-sky-700">
                                Total esperado: S/ {totalProyectado.toFixed(2)}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-brand-muted">
                            Cuotas pendientes o parciales, agrupadas por mes de
                            vencimiento.
                        </p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        <th className="py-2 pr-4">
                                            Período (vencimiento)
                                        </th>
                                        <th className="py-2 pr-4">
                                            Cuotas pendientes
                                        </th>
                                        <th className="py-2">
                                            Monto esperado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {proyeccionCobranza.map((fila) => (
                                        <tr key={fila.periodo}>
                                            <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                {fila.periodo}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {fila.cuotas}
                                            </td>
                                            <td className="py-2 text-sm font-medium text-sky-700">
                                                S/{' '}
                                                {fila.monto_esperado.toFixed(
                                                    2,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {proyeccionCobranza.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                No hay cuotas pendientes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
