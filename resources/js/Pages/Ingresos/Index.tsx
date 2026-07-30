import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import SearchableSelect from '@/Components/SearchableSelect';
import { DocumentTextIcon } from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, Pago, Student, medioPagoLabels } from '@/types/models';
import { formatDate } from '@/utils/date';

export default function Index({
    pagos,
    allStudents,
    filters,
}: {
    pagos: Paginated<Pago>;
    allStudents: Pick<
        Student,
        'id' | 'first_name' | 'last_name' | 'document_number'
    >[];
    filters: { student_id?: string };
}) {
    const [studentId, setStudentId] = useState(filters.student_id ?? '');

    const changeStudent = (nuevoStudentId: string) => {
        setStudentId(nuevoStudentId);
        router.get(
            route('ingresos.index'),
            { student_id: nuevoStudentId },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Ingresos
                    </h2>
                    <Link
                        href={route('caja.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a flujo de caja
                    </Link>
                </div>
            }
        >
            <Head title="Ingresos" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-sm">
                        <SearchableSelect
                            value={studentId}
                            onChange={changeStudent}
                            placeholder="Buscar por nombre o documento"
                            allLabel="Todos los estudiantes"
                            options={allStudents.map((student) => ({
                                value: String(student.id),
                                label: `${student.first_name} ${student.last_name}`,
                                searchText: `${student.first_name} ${student.last_name} ${student.document_number}`,
                            }))}
                        />
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-[20px] border border-brand-border bg-brand-card">
                        <table className="min-w-full divide-y divide-brand-border-faint">
                            <thead className="bg-brand-thead">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Concepto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Modalidad
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border-faint">
                                {pagos.data.map((pago) => (
                                    <tr key={pago.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {formatDate(pago.fecha)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                            {pago.student
                                                ? `${pago.student.first_name} ${pago.student.last_name}`
                                                : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {pago.cuota?.tipo === 'pension'
                                                ? `Pensión${pago.cuota.mes ? ` — ${pago.cuota.mes}` : ''}`
                                                : 'Matrícula'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                            {medioPagoLabels[pago.medio]}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-emerald-700">
                                            S/ {Number(pago.monto).toFixed(2)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
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
                                        </td>
                                    </tr>
                                ))}
                                {pagos.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-brand-muted"
                                        >
                                            No se encontraron ingresos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={pagos.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
