import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SearchableSelect from '@/Components/SearchableSelect';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { ClockIcon, DocumentTextIcon, TrashIcon } from '@/Components/Icons';
import { Transition } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { Course, Paginated, RegistroHoras, Teacher } from '@/types/models';
import { formatDate } from '@/utils/date';

interface PendienteRegistro {
    fecha: string;
    horas_academicas: number;
    monto_neto: number;
}

interface Pendiente {
    teacher: Teacher;
    horas: number;
    monto_neto: number;
    registros: PendienteRegistro[];
}

function GenerarPagoForm({
    teacher,
    registros,
    onDone,
}: {
    teacher: Teacher;
    registros: PendienteRegistro[];
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        teacher_id: teacher.id,
        desde: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
        hasta: new Date().toISOString().slice(0, 10),
    });

    const enRango = useMemo(
        () =>
            registros.filter(
                (r) => r.fecha >= data.desde && r.fecha <= data.hasta,
            ),
        [registros, data.desde, data.hasta],
    );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('registros-horas.generar-pago'), {
            onSuccess: onDone,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-3 rounded-md border border-brand-border p-3"
        >
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel htmlFor="desde" value="Desde" />
                    <DateInput
                        id="desde"
                        className="mt-1 block"
                        value={data.desde}
                        onChange={(v) => setData('desde', v)}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="hasta" value="Hasta" />
                    <DateInput
                        id="hasta"
                        className="mt-1 block"
                        value={data.hasta}
                        onChange={(v) => setData('hasta', v)}
                    />
                </div>
                <PrimaryButton disabled={processing || enRango.length === 0}>
                    Generar pago
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
                {errors.teacher_id && (
                    <p className="w-full text-sm text-red-600">
                        {errors.teacher_id}
                    </p>
                )}
            </div>
            <p className="mt-2 text-sm text-brand-muted">
                En este rango:{' '}
                {enRango.reduce((sum, r) => sum + r.horas_academicas, 0)}{' '}
                horas académicas · Neto: S/{' '}
                {enRango
                    .reduce((sum, r) => sum + r.monto_neto, 0)
                    .toFixed(2)}{' '}
                ({enRango.length} {enRango.length === 1 ? 'registro' : 'registros'})
            </p>
        </form>
    );
}

export default function Index({
    registros,
    pendientesPorDocente,
    teachers,
    courses,
    filters,
    can,
}: {
    registros: Paginated<RegistroHoras>;
    pendientesPorDocente: Pendiente[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    courses: Pick<Course, 'id' | 'name'>[];
    filters: { teacher_id?: string };
    can: { generarPago: boolean };
}) {
    const isDocente = teachers.length === 0;
    const [generandoPagoPara, setGenerandoPagoPara] = useState<number | null>(
        null,
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        teacher_id: '',
        course_id: '',
        fecha: new Date().toISOString().slice(0, 10),
        horas_academicas: '2',
        minutos_tardanza: '0',
        nota: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('registros-horas.store'), {
            onSuccess: () => reset('fecha', 'horas_academicas', 'minutos_tardanza', 'nota'),
        });
    };

    const filterByTeacher = (teacherId: string) => {
        router.get(
            route('registros-horas.index'),
            { teacher_id: teacherId },
            { preserveState: true },
        );
    };

    const deleteRegistro = (id: number) => {
        if (!confirm('¿Eliminar este registro de horas?')) return;
        router.delete(route('registros-horas.destroy', id));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<ClockIcon />}>
                    {isDocente ? 'Mis horas y pagos' : 'Horas y pagos docentes'}
                </PageTitle>
            }
        >
            <Head title="Horas y pagos docentes" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    {!isDocente && pendientesPorDocente.length > 0 && (
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                            <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                                Pendiente de pago
                            </h3>
                            <div className="space-y-3">
                                {pendientesPorDocente.map((pendiente) => (
                                    <div
                                        key={pendiente.teacher.id}
                                        className="rounded-md border border-brand-border p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-brand-ink-strong">
                                                    {pendiente.teacher.first_name}{' '}
                                                    {pendiente.teacher.last_name}
                                                </p>
                                                <p className="text-sm text-brand-muted">
                                                    Total pendiente (todas las fechas):{' '}
                                                    {pendiente.horas} horas académicas ·
                                                    Neto: S/ {pendiente.monto_neto.toFixed(2)}
                                                </p>
                                            </div>
                                            {can.generarPago &&
                                                generandoPagoPara !== pendiente.teacher.id && (
                                                    <SecondaryButton
                                                        onClick={() =>
                                                            setGenerandoPagoPara(
                                                                pendiente.teacher.id,
                                                            )
                                                        }
                                                    >
                                                        Generar pago
                                                    </SecondaryButton>
                                                )}
                                        </div>
                                        <Transition
                                            as="div"
                                            show={
                                                generandoPagoPara ===
                                                pendiente.teacher.id
                                            }
                                            enter="transition-all duration-300 ease-out"
                                            enterFrom="opacity-0 max-h-0"
                                            enterTo="opacity-100 max-h-60"
                                            leave="transition-all duration-200 ease-in"
                                            leaveFrom="opacity-100 max-h-60"
                                            leaveTo="opacity-0 max-h-0"
                                            className="overflow-hidden"
                                        >
                                            <GenerarPagoForm
                                                teacher={pendiente.teacher}
                                                registros={pendiente.registros}
                                                onDone={() =>
                                                    setGenerandoPagoPara(null)
                                                }
                                            />
                                        </Transition>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                            Registrar horas académicas
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {!isDocente && (
                                <div>
                                    <InputLabel htmlFor="teacher_id" value="Docente" />
                                    <select
                                        id="teacher_id"
                                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                        value={data.teacher_id}
                                        onChange={(e) => setData('teacher_id', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.first_name} {teacher.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.teacher_id} className="mt-1" />
                                </div>
                            )}
                            <div>
                                <InputLabel htmlFor="course_id" value="Sección (opcional)" />
                                <select
                                    id="course_id"
                                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                    value={data.course_id}
                                    onChange={(e) => setData('course_id', e.target.value)}
                                >
                                    <option value="">Sin especificar</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="fecha" value="Fecha" />
                                <DateInput
                                    id="fecha"
                                    className="mt-1 block w-full"
                                    value={data.fecha}
                                    onChange={(v) => setData('fecha', v)}
                                />
                                <InputError message={errors.fecha} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="horas_academicas"
                                    value="Horas académicas (45 min c/u)"
                                />
                                <TextInput
                                    id="horas_academicas"
                                    type="number"
                                    step="0.25"
                                    min={0.25}
                                    className="mt-1 block w-full"
                                    value={data.horas_academicas}
                                    onChange={(e) => setData('horas_academicas', e.target.value)}
                                />
                                <InputError message={errors.horas_academicas} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="minutos_tardanza"
                                    value="Minutos de tardanza"
                                />
                                <TextInput
                                    id="minutos_tardanza"
                                    type="number"
                                    min={0}
                                    className="mt-1 block w-full"
                                    value={data.minutos_tardanza}
                                    onChange={(e) => setData('minutos_tardanza', e.target.value)}
                                />
                                <InputError message={errors.minutos_tardanza} className="mt-1" />
                            </div>
                            <div className="sm:col-span-3">
                                <InputLabel htmlFor="nota" value="Nota (opcional)" />
                                <TextInput
                                    id="nota"
                                    className="mt-1 block w-full"
                                    value={data.nota}
                                    onChange={(e) => setData('nota', e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-3">
                                <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Historial
                            </h3>
                            {!isDocente && (
                                <div className="w-56">
                                    <SearchableSelect
                                        value={filters.teacher_id ?? ''}
                                        onChange={filterByTeacher}
                                        placeholder="Buscar docente..."
                                        allLabel="Todos los docentes"
                                        options={teachers.map((teacher) => ({
                                            value: String(teacher.id),
                                            label: `${teacher.first_name} ${teacher.last_name}`,
                                        }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        {!isDocente && <th className="py-2 pr-4">Docente</th>}
                                        <th className="py-2 pr-4">Fecha</th>
                                        <th className="py-2 pr-4">Sección</th>
                                        <th className="py-2 pr-4">Horas</th>
                                        <th className="py-2 pr-4">Tardanza</th>
                                        <th className="py-2 pr-4">Neto</th>
                                        <th className="py-2 pr-4">Estado</th>
                                        <th className="py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {registros.data.map((registro) => (
                                        <tr key={registro.id}>
                                            {!isDocente && (
                                                <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                    {registro.teacher?.first_name}{' '}
                                                    {registro.teacher?.last_name}
                                                </td>
                                            )}
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {formatDate(registro.fecha)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {registro.course?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {registro.horas_academicas}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {registro.minutos_tardanza} min
                                            </td>
                                            <td className="py-2 pr-4 text-sm font-medium text-brand-ink-strong">
                                                S/ {(registro.monto_neto ?? 0).toFixed(2)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        registro.pagado
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {registro.pagado ? 'Pagado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right">
                                                {registro.pagado && registro.egreso_id && (
                                                    <a
                                                        href={route(
                                                            'registros-horas.comprobante',
                                                            registro.egreso_id,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-brand-link hover:opacity-70"
                                                        title="Ver comprobante"
                                                        aria-label="Ver comprobante"
                                                    >
                                                        <DocumentTextIcon className="size-4" />
                                                    </a>
                                                )}
                                                {!registro.pagado && (
                                                    <button
                                                        onClick={() => deleteRegistro(registro.id)}
                                                        className="ms-3 text-sm text-red-600 hover:opacity-70"
                                                        title="Eliminar"
                                                        aria-label="Eliminar"
                                                    >
                                                        <TrashIcon className="size-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {registros.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={isDocente ? 6 : 7}
                                                className="py-4 text-center text-sm text-brand-muted"
                                            >
                                                Sin registros de horas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination links={registros.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
