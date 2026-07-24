import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
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
        semana: '',
        max_score: 20,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('courses.evaluations.store', course.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Nueva evaluación — {course.name}
                </h2>
            }
        >
            <Head title="Nueva evaluación" />

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
                                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                        max={16}
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

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar
                                </PrimaryButton>
                                <Link
                                    href={route('courses.show', course.id)}
                                    className="text-sm text-brand-muted hover:underline"
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
