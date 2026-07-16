import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course } from '@/types/models';

export default function Create({ course }: { course: Course }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'exam',
        weight: 20,
        date: '',
        max_score: 100,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('courses.evaluations.store', course.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Nueva evaluación — {course.name}
                </h2>
            }
        >
            <Head title="Nueva evaluación" />

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
                                        placeholder="Primer parcial"
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
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.type}
                                        onChange={(e) =>
                                            setData('type', e.target.value)
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

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar
                                </PrimaryButton>
                                <Link
                                    href={route('courses.show', course.id)}
                                    className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                                >
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
