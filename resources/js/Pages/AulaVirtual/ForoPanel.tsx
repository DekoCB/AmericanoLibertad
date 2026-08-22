import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { TrashIcon } from '@/Components/Icons';
import { useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { PageProps } from '@/types';
import { Course, ForoTema } from '@/types/models';
import { formatDateTime } from '@/utils/date';

function ForoTemaForm({
    course,
    semana,
    onDone,
}: {
    course: Course;
    semana: number;
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titulo: '',
        pregunta: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('aula-virtual.foro.store', [course.id, semana]), {
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <InputLabel htmlFor="foro-titulo" value="Tema de discusión" />
                <TextInput
                    id="foro-titulo"
                    className="mt-1 block w-full"
                    value={data.titulo}
                    onChange={(e) => setData('titulo', e.target.value)}
                    isFocused
                />
                <InputError message={errors.titulo} className="mt-1" />
            </div>
            <div>
                <InputLabel htmlFor="foro-pregunta" value="Pregunta para el debate" />
                <textarea
                    id="foro-pregunta"
                    rows={3}
                    className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.pregunta}
                    onChange={(e) => setData('pregunta', e.target.value)}
                />
                <InputError message={errors.pregunta} className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Publicar tema
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

function ForoRespuestaForm({ foroTemaId }: { foroTemaId: number }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        contenido: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('foro-temas.respuestas.store', foroTemaId), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="mt-3 flex items-start gap-2">
            <div className="flex-1">
                <textarea
                    rows={2}
                    placeholder="Escribe tu respuesta..."
                    className="block w-full rounded-xl border-brand-border bg-brand-card text-sm shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                    value={data.contenido}
                    onChange={(e) => setData('contenido', e.target.value)}
                />
                <InputError message={errors.contenido} className="mt-1" />
            </div>
            <PrimaryButton disabled={processing} className="mt-0.5">
                Participar
            </PrimaryButton>
        </form>
    );
}

function ForoTemaCard({
    tema,
    course,
    canManage,
    userId,
}: {
    tema: ForoTema;
    course: Course;
    canManage: boolean;
    userId: number;
}) {
    const { delete: destroy } = useForm();

    const eliminarTema = () => {
        if (!confirm('¿Eliminar este tema y todas sus respuestas?')) return;
        destroy(route('aula-virtual.foro.destroy', [course.id, tema.id]));
    };

    const eliminarRespuesta = (respuestaId: number) => {
        if (!confirm('¿Eliminar esta respuesta?')) return;
        destroy(route('foro-respuestas.destroy', respuestaId), {
            preserveScroll: true,
        });
    };

    return (
        <div className="rounded-md border border-brand-border p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-medium text-brand-ink-strong">
                        {tema.titulo}
                    </p>
                    {tema.pregunta && (
                        <p className="mt-1 whitespace-pre-line text-sm text-brand-ink">
                            {tema.pregunta}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-brand-muted-soft">
                        Publicado por {tema.autor?.name ?? 'Docente'} ·{' '}
                        {formatDateTime(tema.created_at)}
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={eliminarTema}
                        className="shrink-0 text-sm text-red-600 hover:opacity-70"
                        title="Eliminar tema"
                        aria-label="Eliminar tema"
                    >
                        <TrashIcon className="size-4" />
                    </button>
                )}
            </div>

            {(tema.respuestas?.length ?? 0) > 0 && (
                <ul className="mt-3 space-y-2 border-t border-brand-border-faint pt-3">
                    {tema.respuestas!.map((respuesta) => (
                        <li
                            key={respuesta.id}
                            className="flex items-start justify-between gap-2 text-sm"
                        >
                            <p>
                                <span className="font-medium text-brand-ink-strong">
                                    {respuesta.user?.name ?? 'Usuario'}:
                                </span>{' '}
                                <span className="text-brand-ink">
                                    {respuesta.contenido}
                                </span>{' '}
                                <span className="text-xs text-brand-muted-soft">
                                    {formatDateTime(respuesta.created_at)}
                                </span>
                            </p>
                            {(canManage || respuesta.user_id === userId) && (
                                <button
                                    onClick={() =>
                                        eliminarRespuesta(respuesta.id)
                                    }
                                    className="shrink-0 text-red-600 hover:opacity-70"
                                    title="Eliminar respuesta"
                                    aria-label="Eliminar respuesta"
                                >
                                    <TrashIcon className="size-3.5" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <ForoRespuestaForm foroTemaId={tema.id} />
        </div>
    );
}

export default function ForoPanel({
    course,
    semana,
    foroTemas,
    canManage,
}: {
    course: Course;
    semana: number;
    foroTemas: ForoTema[];
    canManage: boolean;
}) {
    const [creating, setCreating] = useState(false);
    const { auth } = usePage<PageProps>().props;
    const userId = auth.user.id;

    if (foroTemas.length === 0 && !canManage) return null;

    return (
        <div className="rounded-lg border border-brand-border bg-brand-card p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-ink-strong">
                    Foro / Participación
                </h3>
                {canManage && (
                    <SecondaryButton onClick={() => setCreating(true)}>
                        Nuevo tema
                    </SecondaryButton>
                )}
            </div>

            <div className="mt-4 space-y-4">
                {foroTemas.map((tema) => (
                    <ForoTemaCard
                        key={tema.id}
                        tema={tema}
                        course={course}
                        canManage={canManage}
                        userId={userId}
                    />
                ))}
                {foroTemas.length === 0 && (
                    <p className="text-sm text-brand-muted">
                        Aún no hay temas de discusión para esta semana.
                    </p>
                )}
            </div>

            {canManage && (
                <Modal show={creating} onClose={() => setCreating(false)}>
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Nuevo tema de foro — Semana {semana}
                        </h2>
                        <ForoTemaForm
                            course={course}
                            semana={semana}
                            onDone={() => setCreating(false)}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
