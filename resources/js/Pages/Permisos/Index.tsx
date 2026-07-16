import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Pagination from '@/Components/Pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    Paginated,
    PermisoDocente,
    Teacher,
    permisoEstadoLabels,
    permisoTipoLabels,
} from '@/types/models';

const estadoBadge: Record<PermisoDocente['estado'], string> = {
    pendiente:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    aprobado:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function Index({
    permisos,
    teachers,
    can,
}: {
    permisos: Paginated<PermisoDocente>;
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    can: { respond: boolean };
}) {
    const isDocente = teachers.length === 0;

    const { data, setData, post, processing, errors, reset } = useForm({
        teacher_id: '',
        tipo: 'permiso',
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: new Date().toISOString().slice(0, 10),
        motivo: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('permisos.store'), {
            onSuccess: () => reset('fecha_inicio', 'fecha_fin', 'motivo'),
        });
    };

    const responder = (permisoId: number, estado: 'aprobado' | 'rechazado') => {
        router.patch(route('permisos.update', permisoId), { estado });
    };

    const cancelar = (permisoId: number) => {
        if (!confirm('¿Cancelar esta solicitud?')) return;
        router.delete(route('permisos.destroy', permisoId));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Permisos y licencias
                </h2>
            }
        >
            <Head title="Permisos y licencias" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                            Solicitar permiso
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <InputLabel htmlFor="tipo" value="Tipo" />
                                <select
                                    id="tipo"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    value={data.tipo}
                                    onChange={(e) => setData('tipo', e.target.value)}
                                >
                                    {Object.entries(permisoTipoLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="fecha_inicio" value="Desde" />
                                <TextInput
                                    id="fecha_inicio"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.fecha_inicio}
                                    onChange={(e) => setData('fecha_inicio', e.target.value)}
                                />
                                <InputError message={errors.fecha_inicio} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="fecha_fin" value="Hasta" />
                                <TextInput
                                    id="fecha_fin"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.fecha_fin}
                                    onChange={(e) => setData('fecha_fin', e.target.value)}
                                />
                                <InputError message={errors.fecha_fin} className="mt-1" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="motivo" value="Motivo (opcional)" />
                                <TextInput
                                    id="motivo"
                                    className="mt-1 block w-full"
                                    value={data.motivo}
                                    onChange={(e) => setData('motivo', e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <PrimaryButton disabled={processing}>
                                    Enviar solicitud
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                            Solicitudes
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        {!isDocente && <th className="py-2 pr-4">Docente</th>}
                                        <th className="py-2 pr-4">Tipo</th>
                                        <th className="py-2 pr-4">Desde</th>
                                        <th className="py-2 pr-4">Hasta</th>
                                        <th className="py-2 pr-4">Motivo</th>
                                        <th className="py-2 pr-4">Estado</th>
                                        <th className="py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {permisos.data.map((permiso) => (
                                        <tr key={permiso.id}>
                                            {!isDocente && (
                                                <td className="py-2 pr-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {permiso.teacher?.first_name}{' '}
                                                    {permiso.teacher?.last_name}
                                                </td>
                                            )}
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {permisoTipoLabels[permiso.tipo]}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {permiso.fecha_inicio}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {permiso.fecha_fin}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-gray-700 dark:text-gray-300">
                                                {permiso.motivo ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${estadoBadge[permiso.estado]}`}
                                                >
                                                    {permisoEstadoLabels[permiso.estado]}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right text-sm">
                                                {can.respond && permiso.estado === 'pendiente' && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                responder(permiso.id, 'aprobado')
                                                            }
                                                            className="text-green-600 hover:underline dark:text-green-400"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                responder(permiso.id, 'rechazado')
                                                            }
                                                            className="ms-3 text-red-600 hover:underline dark:text-red-400"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                {isDocente && permiso.estado === 'pendiente' && (
                                                    <button
                                                        onClick={() => cancelar(permiso.id)}
                                                        className="text-red-600 hover:underline dark:text-red-400"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {permisos.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={isDocente ? 5 : 6}
                                                className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Sin solicitudes registradas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination links={permisos.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
