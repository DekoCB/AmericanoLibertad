import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, Evaluation, evaluationTypeLabels } from '@/types/models';

export default function Edit({
    evaluation,
    course,
}: {
    evaluation: Evaluation;
    course: Course;
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: evaluation.name,
        type: evaluation.type,
        weight: evaluation.weight,
        date: evaluation.date,
        semana: evaluation.semana ? String(evaluation.semana) : '',
        max_score: evaluation.max_score,
    });

    const { delete: destroy } = useForm();

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('evaluations.update', evaluation.id));
    };

    const remove = () => {
        if (!confirm('¿Eliminar esta evaluación y sus calificaciones?')) {
            return;
        }
        destroy(route('evaluations.destroy', evaluation.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Editar evaluación — {course.name}
                </h2>
            }
        >
            <Head title="Editar evaluación" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InputLabel htmlFor="name" value="Nombre" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="type" value="Tipo" />
                                    <div className="mt-1">
                                        <SelectMenu
                                            id="type"
                                            value={data.type}
                                            onChange={(value) =>
                                                setData(
                                                    'type',
                                                    value as Evaluation['type'],
                                                )
                                            }
                                            options={Object.entries(
                                                evaluationTypeLabels,
                                            ).map(([value, label]) => ({
                                                value,
                                                label,
                                            }))}
                                        />
                                    </div>
                                    <InputError
                                        message={errors.type}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="date"
                                        value="Fecha"
                                    />
                                    <DateInput
                                        id="date"
                                        className="mt-1 block w-full"
                                        value={data.date}
                                        onChange={(v) => setData('date', v)}
                                    />
                                    <InputError
                                        message={errors.date}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="semana"
                                        value="Semana"
                                    />
                                    <TextInput
                                        id="semana"
                                        type="number"
                                        min={1}
                                        max={20}
                                        required
                                        className="mt-1 block w-full"
                                        value={data.semana}
                                        onChange={(e) =>
                                            setData('semana', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.semana}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="weight"
                                        value="Ponderación (%)"
                                    />
                                    <TextInput
                                        id="weight"
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="mt-1 block w-full"
                                        value={data.weight}
                                        onChange={(e) =>
                                            setData(
                                                'weight',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.weight}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="max_score"
                                        value="Puntaje máximo"
                                    />
                                    <TextInput
                                        id="max_score"
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="mt-1 block w-full"
                                        value={data.max_score}
                                        onChange={(e) =>
                                            setData(
                                                'max_score',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.max_score}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        Guardar cambios
                                    </PrimaryButton>
                                    <Link
                                        href={route(
                                            'courses.show',
                                            course.id,
                                        )}
                                        className="text-sm text-brand-muted hover:underline"
                                    >
                                        Cancelar
                                    </Link>
                                </div>
                                <DangerButton type="button" onClick={remove}>
                                    Eliminar evaluación
                                </DangerButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
