import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        document_number: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        address: '',
        status: 'active',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('students.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Nuevo estudiante
                </h2>
            }
        >
            <Head title="Nuevo estudiante" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="document_number"
                                        value="Número de documento"
                                    />
                                    <TextInput
                                        id="document_number"
                                        className="mt-1 block w-full"
                                        value={data.document_number}
                                        onChange={(e) =>
                                            setData(
                                                'document_number',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.document_number}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="status"
                                        value="Estado"
                                    />
                                    <select
                                        id="status"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData('status', e.target.value)
                                        }
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">
                                            Inactivo
                                        </option>
                                        <option value="graduated">
                                            Graduado
                                        </option>
                                    </select>
                                    <InputError
                                        message={errors.status}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="first_name"
                                        value="Nombres"
                                    />
                                    <TextInput
                                        id="first_name"
                                        className="mt-1 block w-full"
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                'first_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.first_name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="last_name"
                                        value="Apellidos"
                                    />
                                    <TextInput
                                        id="last_name"
                                        className="mt-1 block w-full"
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData(
                                                'last_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.last_name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="email"
                                        value="Email"
                                    />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="phone"
                                        value="Teléfono"
                                    />
                                    <TextInput
                                        id="phone"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.phone}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="birth_date"
                                        value="Fecha de nacimiento"
                                    />
                                    <TextInput
                                        id="birth_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.birth_date}
                                        onChange={(e) =>
                                            setData(
                                                'birth_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.birth_date}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel
                                        htmlFor="address"
                                        value="Dirección"
                                    />
                                    <TextInput
                                        id="address"
                                        className="mt-1 block w-full"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.address}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar
                                </PrimaryButton>
                                <Link
                                    href={route('students.index')}
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
