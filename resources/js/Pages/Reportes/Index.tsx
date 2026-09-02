import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import { ArrowDownTrayIcon, ArrowTrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@/Components/Icons';
import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import { Paginated } from '@/types/models';
import { formatDate } from '@/utils/date';

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

interface DeudorRow {
    student_id: number;
    first_name: string;
    last_name: string;
    document_number: string;
    carrera_name: string;
    ciclo: number;
    deuda: number;
    cuotas_pendientes: number;
    vencimiento_mas_antiguo: string | null;
}

interface CarreraOption {
    id: number;
    name: string;
    total_ciclos: number;
}

function DeudoresPager({
    currentPage,
    lastPage,
    onChange,
}: {
    currentPage: number;
    lastPage: number;
    onChange: (page: number) => void;
}) {
    if (lastPage <= 1) return null;

    return (
        <div className="mt-4 flex items-center justify-between">
            <button
                type="button"
                onClick={() => onChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1 text-xs font-medium hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronLeftIcon className="size-3.5" />
                Anterior
            </button>
            <span className="text-xs text-brand-muted">
                Página {currentPage} de {lastPage}
            </span>
            <button
                type="button"
                onClick={() => onChange(Math.min(lastPage, currentPage + 1))}
                disabled={currentPage >= lastPage}
                className="flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1 text-xs font-medium hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
                Siguiente
                <ChevronRightIcon className="size-3.5" />
            </button>
        </div>
    );
}

export default function Index({
    ingresosPorPeriodo,
    moraPorCarrera,
    proyeccionCobranza,
    deudores,
    carreras,
    filters,
}: {
    ingresosPorPeriodo: IngresoPeriodo[];
    moraPorCarrera: MoraCarrera[];
    proyeccionCobranza: ProyeccionPeriodo[];
    deudores: Paginated<DeudorRow>;
    carreras: CarreraOption[];
    filters: { carrera_id: number | null; ciclo: number | null };
}) {
    const totalMora = moraPorCarrera.reduce(
        (sum, fila) => sum + fila.monto_vencido,
        0,
    );
    const totalProyectado = proyeccionCobranza.reduce(
        (sum, fila) => sum + fila.monto_esperado,
        0,
    );
    const totalDeuda = deudores.data.reduce(
        (sum, fila) => sum + fila.deuda,
        0,
    );

    const carreraId = filters.carrera_id ? String(filters.carrera_id) : '';
    const ciclo = filters.ciclo ? String(filters.ciclo) : '';

    const carreraSeleccionada = carreras.find(
        (c) => String(c.id) === carreraId,
    );

    const ciclosDisponibles = useMemo(
        () =>
            carreraSeleccionada
                ? Array.from(
                      { length: carreraSeleccionada.total_ciclos },
                      (_, i) => i + 1,
                  )
                : [],
        [carreraSeleccionada],
    );

    const recargarDeudores = (
        nuevoCarreraId: string,
        nuevoCiclo: string,
        page = 1,
    ) => {
        router.get(
            route('reportes.index'),
            {
                carrera_id: nuevoCarreraId || undefined,
                ciclo: nuevoCiclo || undefined,
                deudores_page: page,
            },
            { only: ['deudores', 'filters'], preserveState: true, preserveScroll: true },
        );
    };

    const exportUrl = route('reportes.exportar', {
        carrera_id: filters.carrera_id ?? undefined,
        ciclo: filters.ciclo ?? undefined,
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <PageTitle icon={<ArrowTrendingUpIcon />}>
                        Reportes financieros
                    </PageTitle>
                    <a
                        href={exportUrl}
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

                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Deudores
                            </h3>
                            <span className="text-sm font-medium text-red-700">
                                Deuda en esta página: S/{' '}
                                {totalDeuda.toFixed(2)}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-brand-muted">
                            Estudiantes con cuotas pendientes, parciales o
                            vencidas. Filtra por carrera y ciclo.
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Carrera" />
                                <div className="mt-1">
                                    <SelectMenu
                                        value={carreraId}
                                        onChange={(value) =>
                                            recargarDeudores(value, '')
                                        }
                                        placeholder="Todas las carreras"
                                        options={carreras.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
                                        }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Ciclo" />
                                <div className="mt-1">
                                    <SelectMenu
                                        value={ciclo}
                                        onChange={(value) =>
                                            recargarDeudores(
                                                carreraId,
                                                value,
                                            )
                                        }
                                        placeholder={
                                            carreraId
                                                ? 'Todos los ciclos'
                                                : 'Elige una carrera primero'
                                        }
                                        options={ciclosDisponibles.map(
                                            (c) => ({
                                                value: String(c),
                                                label: `Ciclo ${c}`,
                                            }),
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        <th className="py-2 pr-4">
                                            Estudiante
                                        </th>
                                        <th className="py-2 pr-4">DNI</th>
                                        <th className="py-2 pr-4">
                                            Carrera · Ciclo
                                        </th>
                                        <th className="py-2 pr-4">
                                            Cuotas pendientes
                                        </th>
                                        <th className="py-2 pr-4">Deuda</th>
                                        <th className="py-2">
                                            Vencida desde
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {deudores.data.map((fila) => (
                                        <tr key={fila.student_id}>
                                            <td className="whitespace-nowrap py-2 pr-4 text-sm font-medium text-brand-ink-strong">
                                                {fila.first_name}{' '}
                                                {fila.last_name}
                                            </td>
                                            <td className="whitespace-nowrap py-2 pr-4 text-sm text-brand-ink">
                                                {fila.document_number}
                                            </td>
                                            <td className="whitespace-nowrap py-2 pr-4 text-sm text-brand-ink">
                                                {fila.carrera_name} · Ciclo{' '}
                                                {fila.ciclo}
                                            </td>
                                            <td className="whitespace-nowrap py-2 pr-4 text-sm text-brand-ink">
                                                {fila.cuotas_pendientes}
                                            </td>
                                            <td className="whitespace-nowrap py-2 pr-4 text-sm font-medium text-red-700">
                                                S/ {fila.deuda.toFixed(2)}
                                            </td>
                                            <td className="whitespace-nowrap py-2 text-sm text-brand-ink">
                                                {fila.vencimiento_mas_antiguo
                                                    ? formatDate(
                                                          fila.vencimiento_mas_antiguo,
                                                      )
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {deudores.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                No hay deudores con estos
                                                filtros.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <DeudoresPager
                            currentPage={deudores.current_page}
                            lastPage={deudores.last_page}
                            onChange={(page) =>
                                recargarDeudores(carreraId, ciclo, page)
                            }
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
