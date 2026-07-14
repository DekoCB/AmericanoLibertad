import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, Evaluation } from '@/types/models';

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editar evaluación — {course.name}
                </h2>
            }
        >
            <Head title="Editar evaluación" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
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
                                    <select
                                        id="type"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.type}
                                        onChange={(e) =>
                                            setData(
                                                'type',
                                                e.target
                                                    .value as Evaluation['type'],
                                            )
                                        }
                                    >
                                        <option value="exam">Examen</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="homework">
                                            Tarea
                                        </option>
                                        <option value="project">
                                            Proyecto
                                        </option>
                                    </select>
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
                                    <TextInput
                                        id="date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.date}
                                        onChange={(e) =>
                                            setData('date', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.date}
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
                                        max={1000}
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
                                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
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
