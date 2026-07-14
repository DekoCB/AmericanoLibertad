import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Subject } from '@/types/models';

export default function Edit({ subject }: { subject: Subject }) {
    const { data, setData, put, processing, errors } = useForm({
        name: subject.name,
        code: subject.code,
        description: subject.description ?? '',
        credit_hours: subject.credit_hours,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('subjects.update', subject.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editar materia
                </h2>
            }
        >
            <Head title="Editar materia" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
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
                                    <InputLabel
                                        htmlFor="code"
                                        value="Código"
                                    />
                                    <TextInput
                                        id="code"
                                        className="mt-1 block w-full"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData('code', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.code}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="credit_hours"
                                        value="Horas crédito"
                                    />
                                    <TextInput
                                        id="credit_hours"
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="mt-1 block w-full"
                                        value={data.credit_hours}
                                        onChange={(e) =>
                                            setData(
                                                'credit_hours',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.credit_hours}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel
                                        htmlFor="description"
                                        value="Descripción"
                                    />
                                    <textarea
                                        id="description"
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.description}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar cambios
                                </PrimaryButton>
                                <Link
                                    href={route('subjects.index')}
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
