import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Course, RecursoAula, recursoTipoLabels } from '@/types/models';

const tipoBadge: Record<RecursoAula['tipo'], string> = {
    anuncio: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    enlace:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    archivo:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function RecursoForm({ course, onDone }: { course: Course; onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titulo: '',
        tipo: 'anuncio',
        descripcion: '',
        url: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('aula-virtual.store', course.id), {
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mb-6 space-y-3 rounded-md border border-gray-200 p-4 dark:border-gray-700"
        >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="titulo" value="Título" />
                    <TextInput
                        id="titulo"
                        className="mt-1 block w-full"
                        value={data.titulo}
                        onChange={(e) => setData('titulo', e.target.value)}
                    />
                    <InputError message={errors.titulo} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="tipo" value="Tipo" />
                    <select
                        id="tipo"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        value={data.tipo}
                        onChange={(e) => setData('tipo', e.target.value)}
                    >
                        {Object.entries(recursoTipoLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                {data.tipo !== 'anuncio' && (
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="url" value="URL" />
                        <TextInput
                            id="url"
                            type="url"
                            placeholder="https://..."
                            className="mt-1 block w-full"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                        />
                        <InputError message={errors.url} className="mt-1" />
                    </div>
                )}
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="descripcion" value="Descripción" />
                    <textarea
                        id="descripcion"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                    />
                    <InputError message={errors.descripcion} className="mt-1" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>Publicar</PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function Show({
    course,
    recursos,
    can,
}: {
    course: Course;
    recursos: RecursoAula[];
    can: { manage: boolean };
}) {
    const [showForm, setShowForm] = useState(false);
    const { delete: destroy } = useForm();

    const deleteRecurso = (recursoId: number) => {
        if (!confirm('¿Eliminar este recurso?')) return;
        destroy(route('aula-virtual.destroy', [course.id, recursoId]));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Aula virtual — {course.name}
                    </h2>
                    <Link
                        href={route('aula-virtual.index')}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Aula virtual — ${course.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Recursos y anuncios
                            </h3>
                            {can.manage && !showForm && (
                                <PrimaryButton onClick={() => setShowForm(true)}>
                                    Nuevo recurso
                                </PrimaryButton>
                            )}
                        </div>

                        {showForm && (
                            <RecursoForm
                                course={course}
                                onDone={() => setShowForm(false)}
                            />
                        )}

                        <ul className="space-y-4">
                            {recursos.map((recurso) => (
                                <li
                                    key={recurso.id}
                                    className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadge[recurso.tipo]}`}
                                                >
                                                    {recursoTipoLabels[recurso.tipo]}
                                                </span>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {recurso.titulo}
                                                </p>
                                            </div>
                                            {recurso.descripcion && (
                                                <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                                                    {recurso.descripcion}
                                                </p>
                                            )}
                                            {recurso.url && (
                                                <a
                                                    href={recurso.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {recurso.url}
                                                </a>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                {recurso.created_at}
                                            </p>
                                        </div>
                                        {can.manage && (
                                            <button
                                                onClick={() => deleteRecurso(recurso.id)}
                                                className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {recursos.length === 0 && (
                                <li className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Aún no hay recursos publicados en este curso.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
