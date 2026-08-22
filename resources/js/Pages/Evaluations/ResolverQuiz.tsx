import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Evaluation } from '@/types/models';

interface OpcionResolver {
    id: number;
    texto: string;
}

interface PreguntaResolver {
    id: number;
    texto: string;
    opciones: OpcionResolver[];
}

export default function ResolverQuiz({
    evaluation,
    preguntas,
}: {
    evaluation: Evaluation;
    preguntas: PreguntaResolver[];
}) {
    const [faltantes, setFaltantes] = useState(false);
    const { data, setData, post, processing } = useForm<{
        respuestas: Record<number, number | null>;
    }>({
        respuestas: Object.fromEntries(preguntas.map((p) => [p.id, null])),
    });

    const elegirOpcion = (preguntaId: number, opcionId: number) => {
        setData('respuestas', { ...data.respuestas, [preguntaId]: opcionId });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const sinResponder = preguntas.some((p) => !data.respuestas[p.id]);
        if (sinResponder) {
            setFaltantes(true);
            return;
        }

        setFaltantes(false);
        post(route('evaluations.resolver.store', evaluation.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    {evaluation.name} — {evaluation.course?.name}
                </h2>
            }
        >
            <Head title={`Resolver — ${evaluation.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <form
                        onSubmit={submit}
                        className="space-y-6 border border-brand-border bg-brand-card p-6 sm:rounded-lg"
                    >
                        <p className="text-sm text-brand-muted">
                            Responde todas las preguntas y presiona enviar.
                            Solo puedes enviar el cuestionario una vez.
                        </p>

                        {preguntas.map((pregunta, index) => (
                            <div
                                key={pregunta.id}
                                className="rounded-md border border-brand-border p-4"
                            >
                                <p className="font-medium text-brand-ink-strong">
                                    {index + 1}. {pregunta.texto}
                                </p>
                                <div className="mt-3 space-y-2">
                                    {pregunta.opciones.map((opcion) => (
                                        <label
                                            key={opcion.id}
                                            className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink"
                                        >
                                            <input
                                                type="radio"
                                                name={`pregunta-${pregunta.id}`}
                                                checked={
                                                    data.respuestas[
                                                        pregunta.id
                                                    ] === opcion.id
                                                }
                                                onChange={() =>
                                                    elegirOpcion(
                                                        pregunta.id,
                                                        opcion.id,
                                                    )
                                                }
                                                className="text-brand-navy focus:ring-brand-navy"
                                            />
                                            {opcion.texto}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {faltantes && (
                            <p className="text-sm text-red-600">
                                Debes responder todas las preguntas antes de
                                enviar.
                            </p>
                        )}

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Enviar cuestionario
                            </PrimaryButton>
                            <Link
                                href={route(
                                    'aula-virtual.show',
                                    evaluation.course_id,
                                )}
                                className="text-sm text-brand-muted hover:underline"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
