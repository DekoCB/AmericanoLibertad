import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { CheckIcon, DocumentTextIcon, XMarkIcon } from '@/Components/Icons';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    Paginated,
    PermisoDocente,
    Teacher,
    permisoEstadoLabels,
    permisoTipoLabels,
} from '@/types/models';
import { formatDate } from '@/utils/date';

const estadoBadge: Record<PermisoDocente['estado'], string> = {
    pendiente:
        'bg-yellow-100 text-yellow-800',
    aprobado:
        'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
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
                <PageTitle icon={<DocumentTextIcon />}>
                    Permisos y licencias
                </PageTitle>
            }
        >
            <Head title="Permisos y licencias" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                            Solicitar permiso
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <InputLabel htmlFor="tipo" value="Tipo" />
                                <select
                                    id="tipo"
                                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                <DateInput
                                    id="fecha_inicio"
                                    className="mt-1 block w-full"
                                    value={data.fecha_inicio}
                                    onChange={(v) => setData('fecha_inicio', v)}
                                />
                                <InputError message={errors.fecha_inicio} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="fecha_fin" value="Hasta" />
                                <DateInput
                                    id="fecha_fin"
                                    className="mt-1 block w-full"
                                    value={data.fecha_fin}
                                    onChange={(v) => setData('fecha_fin', v)}
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

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <h3 className="mb-4 text-lg font-bold text-brand-ink-strong">
                            Solicitudes
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-brand-muted">
                                        {!isDocente && <th className="py-2 pr-4">Docente</th>}
                                        <th className="py-2 pr-4">Tipo</th>
                                        <th className="py-2 pr-4">Desde</th>
                                        <th className="py-2 pr-4">Hasta</th>
                                        <th className="py-2 pr-4">Motivo</th>
                                        <th className="py-2 pr-4">Estado</th>
                                        <th className="py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {permisos.data.map((permiso) => (
                                        <tr key={permiso.id}>
                                            {!isDocente && (
                                                <td className="py-2 pr-4 text-sm text-brand-ink-strong">
                                                    {permiso.teacher?.first_name}{' '}
                                                    {permiso.teacher?.last_name}
                                                </td>
                                            )}
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {permisoTipoLabels[permiso.tipo]}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {formatDate(permiso.fecha_inicio)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
                                                {formatDate(permiso.fecha_fin)}
                                            </td>
                                            <td className="py-2 pr-4 text-sm text-brand-ink">
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
                                                            className="text-green-600 hover:opacity-70"
                                                            title="Aprobar"
                                                            aria-label="Aprobar"
                                                        >
                                                            <CheckIcon className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                responder(permiso.id, 'rechazado')
                                                            }
                                                            className="ms-3 text-red-600 hover:opacity-70"
                                                            title="Rechazar"
                                                            aria-label="Rechazar"
                                                        >
                                                            <XMarkIcon className="size-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {isDocente && permiso.estado === 'pendiente' && (
                                                    <button
                                                        onClick={() => cancelar(permiso.id)}
                                                        className="text-red-600 hover:underline"
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
                                                className="py-4 text-center text-sm text-brand-muted"
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
