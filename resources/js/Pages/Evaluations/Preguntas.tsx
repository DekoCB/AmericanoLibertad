import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Evaluation, QuizPregunta } from '@/types/models';

interface OpcionForm {
    texto: string;
    es_correcta: boolean;
}

function PreguntaForm({
    pregunta,
    evaluationId,
    onDone,
}: {
    pregunta?: QuizPregunta;
    evaluationId: number;
    onDone: () => void;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        texto: string;
        opciones: OpcionForm[];
    }>({
        texto: pregunta?.texto ?? '',
        opciones: pregunta?.opciones?.map((o) => ({
            texto: o.texto,
            es_correcta: o.es_correcta,
        })) ?? [
            { texto: '', es_correcta: true },
            { texto: '', es_correcta: false },
        ],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (pregunta) {
            put(route('preguntas.update', pregunta.id), {
                onSuccess: () => {
                    reset();
                    onDone();
                },
            });
        } else {
            post(route('evaluations.preguntas.store', evaluationId), {
                onSuccess: () => {
                    reset();
                    onDone();
                },
            });
        }
    };

    const updateOpcion = (index: number, texto: string) => {
        setData(
            'opciones',
            data.opciones.map((o, i) => (i === index ? { ...o, texto } : o)),
        );
    };

    const marcarCorrecta = (index: number) => {
        setData(
            'opciones',
            data.opciones.map((o, i) => ({ ...o, es_correcta: i === index })),
        );
    };

    const agregarOpcion = () => {
        if (data.opciones.length >= 6) return;
        setData('opciones', [
            ...data.opciones,
            { texto: '', es_correcta: false },
        ]);
    };

    const quitarOpcion = (index: number) => {
        if (data.opciones.length <= 2) return;
        const nuevas = data.opciones.filter((_, i) => i !== index);
        if (!nuevas.some((o) => o.es_correcta)) nuevas[0].es_correcta = true;
        setData('opciones', nuevas);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <InputLabel htmlFor="texto" value="Pregunta" />
                <TextInput
                    id="texto"
                    className="mt-1 block w-full"
                    value={data.texto}
                    onChange={(e) => setData('texto', e.target.value)}
                    isFocused
                />
                <InputError message={errors.texto} className="mt-1" />
            </div>

            <div className="space-y-2">
                <InputLabel value="Opciones (marca la correcta)" />
                {data.opciones.map((opcion, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="opcion-correcta"
                            checked={opcion.es_correcta}
                            onChange={() => marcarCorrecta(index)}
                            className="text-brand-navy focus:ring-brand-navy"
                        />
                        <TextInput
                            className="block flex-1"
                            placeholder={`Opción ${index + 1}`}
                            value={opcion.texto}
                            onChange={(e) =>
                                updateOpcion(index, e.target.value)
                            }
                        />
                        {data.opciones.length > 2 && (
                            <button
                                type="button"
                                onClick={() => quitarOpcion(index)}
                                className="text-red-600 hover:opacity-70"
                                title="Quitar opción"
                                aria-label="Quitar opción"
                            >
                                <TrashIcon className="size-4" />
                            </button>
                        )}
                    </div>
                ))}
                <InputError message={errors.opciones} className="mt-1" />
                {data.opciones.length < 6 && (
                    <SecondaryButton type="button" onClick={agregarOpcion}>
                        Agregar opción
                    </SecondaryButton>
                )}
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    {pregunta ? 'Guardar cambios' : 'Agregar pregunta'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function Preguntas({
    evaluation,
    preguntas,
    tieneIntentos,
}: {
    evaluation: Evaluation;
    preguntas: QuizPregunta[];
    tieneIntentos: boolean;
}) {
    const [creating, setCreating] = useState(false);
    const [editingPregunta, setEditingPregunta] =
        useState<QuizPregunta | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const deletePregunta = (id: number) => {
        if (!confirm('¿Eliminar esta pregunta?')) return;
        router.delete(route('preguntas.destroy', id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Preguntas — {evaluation.name}
                </h2>
            }
        >
            <Head title={`Preguntas — ${evaluation.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    {tieneIntentos && (
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                            Ya hay estudiantes que respondieron este
                            cuestionario, así que las preguntas ya no se
                            pueden modificar.
                        </div>
                    )}

                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Preguntas
                            </h3>
                            {!tieneIntentos && (
                                <PrimaryButton
                                    onClick={() => setCreating(true)}
                                >
                                    Nueva pregunta
                                </PrimaryButton>
                            )}
                        </div>

                        <ul className="mt-4 space-y-4">
                            {preguntas.map((pregunta, index) => (
                                <li
                                    key={pregunta.id}
                                    className="rounded-md border border-brand-border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-medium text-brand-ink-strong">
                                            {index + 1}. {pregunta.texto}
                                        </p>
                                        {!tieneIntentos && (
                                            <div className="flex shrink-0 items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingPregunta(
                                                            pregunta,
                                                        );
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="text-brand-link hover:opacity-70"
                                                    title="Editar"
                                                    aria-label="Editar"
                                                >
                                                    <PencilIcon className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deletePregunta(
                                                            pregunta.id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:opacity-70"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {pregunta.opciones?.map((opcion) => (
                                            <li
                                                key={opcion.id}
                                                className={
                                                    opcion.es_correcta
                                                        ? 'font-medium text-green-700'
                                                        : 'text-brand-muted'
                                                }
                                            >
                                                {opcion.es_correcta
                                                    ? '✓ '
                                                    : '— '}
                                                {opcion.texto}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                            {preguntas.length === 0 && (
                                <li className="py-4 text-center text-sm text-brand-muted">
                                    Este cuestionario todavía no tiene
                                    preguntas.
                                </li>
                            )}
                        </ul>
                    </div>

                    <Link
                        href={route('courses.show', evaluation.course_id)}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a la sección
                    </Link>
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva pregunta
                    </h2>
                    <PreguntaForm
                        evaluationId={evaluation.id}
                        onDone={() => setCreating(false)}
                    />
                </div>
            </Modal>

            <Modal show={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar pregunta
                    </h2>
                    {editingPregunta && (
                        <PreguntaForm
                            pregunta={editingPregunta}
                            evaluationId={evaluation.id}
                            onDone={() => setEditModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
