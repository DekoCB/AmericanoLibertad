import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Pagination from '@/Components/Pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Course, Paginated, RegistroHoras, Teacher } from '@/types/models';

interface Pendiente {
    teacher: Teacher;
    horas: number;
    monto_neto: number;
}

function GenerarPagoForm({
    teacher,
    onDone,
}: {
    teacher: Teacher;
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        teacher_id: teacher.id,
        desde: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
        hasta: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('registros-horas.generar-pago'), {
            onSuccess: onDone,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
        >
            <div>
                <InputLabel htmlFor="desde" value="Desde" />
                <TextInput
                    id="desde"
                    type="date"
                    className="mt-1 block"
                    value={data.desde}
                    onChange={(e) => setData('desde', e.target.value)}
                />
            </div>
            <div>
                <InputLabel htmlFor="hasta" value="Hasta" />
                <TextInput
                    id="hasta"
                    type="date"
                    className="mt-1 block"
                    value={data.hasta}
                    onChange={(e) => setData('hasta', e.target.value)}
                />
            </div>
            <PrimaryButton disabled={processing}>Generar pago</PrimaryButton>
            <SecondaryButton type="button" onClick={onDone}>
                Cancelar
            </SecondaryButton>
            {errors.teacher_id && (
                <p className="w-full text-sm text-red-600 dark:text-red-400">
                    {errors.teacher_id}
                </p>
            )}
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
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {isDocente ? 'Mis horas y pagos' : 'Horas y pagos docentes'}
                </h2>
            }
        >
            <Head title="Horas y pagos docentes" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    {!isDocente && pendientesPorDocente.length > 0 && (
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Pendiente de pago
                            </h3>
                            <div className="space-y-3">
                                {pendientesPorDocente.map((pendiente) => (
                                    <div
                                        key={pendiente.teacher.id}
                                        className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {pendiente.teacher.first_name}{' '}
                                                    {pendiente.teacher.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                        {generandoPagoPara === pendiente.teacher.id && (
                                            <GenerarPagoForm
                                                teacher={pendiente.teacher}
                                                onDone={() => setGenerandoPagoPara(null)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                            Registrar horas académicas
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {!isDocente && (
                                <div>
                                    <InputLabel htmlFor="teacher_id" value="Docente" />
                                    <select
                                        id="teacher_id"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                                <InputLabel htmlFor="course_id" value="Curso (opcional)" />
                                <select
                                    id="course_id"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                                <TextInput
                                    id="fecha"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.fecha}
                                    onChange={(e) => setData('fecha', e.target.value)}
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

                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Historial
                            </h3>
                            {!isDocente && (
                                <select
                                    className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    value={filters.teacher_id ?? ''}
                                    onChange={(e) => filterByTeacher(e.target.value)}
                                >
                                    <option value="">Todos los docentes</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.first_name} {teacher.last_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        {!isDocente && <th className="py-2 pr-4">Docente</th>}
                                        <th className="py-2 pr-4">Fecha</th>
                                        <th className="py-2 pr-4">Curso</th>
                                        <th className="py-2 pr-4">Horas</th>
                                        <th className="py-2 pr-4">Tardanza</th>
                                        <th className="py-2 pr-4">Neto</th>
                                        <th className="py-2 pr-4">Estado</th>
                                        <th className="py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {registros.data.map((registro) => (
                                        <tr key={registro.id}>
                                            {!isDocente && (
                                                <td className="py-2 pr-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {registro.teacher?.first_name}{' '}
                                                    {registro.teacher?.last_name}
                                                </td>
                                            )}
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {registro.fecha}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {registro.course?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {registro.horas_academicas}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {registro.minutos_tardanza} min
                                            </td>
                                            <td className="py-2 pr-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                S/ {(registro.monto_neto ?? 0).toFixed(2)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        registro.pagado
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                                    }`}
                                                >
                                                    {registro.pagado ? 'Pagado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right">
                                                {!registro.pagado && (
                                                    <button
                                                        onClick={() => deleteRegistro(registro.id)}
                                                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {registros.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={isDocente ? 6 : 7}
                                                className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
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
