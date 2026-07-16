import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        concepto: '',
        categoria: 'operativo',
        monto: '',
        fecha: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('egresos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Nuevo egreso
                </h2>
            }
        >
            <Head title="Nuevo egreso" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InputLabel
                                        htmlFor="concepto"
                                        value="Concepto"
                                    />
                                    <TextInput
                                        id="concepto"
                                        className="mt-1 block w-full"
                                        placeholder="Pago de servicios, planilla docente, etc."
                                        value={data.concepto}
                                        onChange={(e) =>
                                            setData('concepto', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.concepto}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="categoria"
                                        value="Categoría"
                                    />
                                    <select
                                        id="categoria"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.categoria}
                                        onChange={(e) =>
                                            setData(
                                                'categoria',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="pago_docente">
                                            Pago a docente
                                        </option>
                                        <option value="operativo">
                                            Operativo
                                        </option>
                                        <option value="otro">Otro</option>
                                    </select>
                                    <InputError
                                        message={errors.categoria}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="monto"
                                        value="Monto"
                                    />
                                    <TextInput
                                        id="monto"
                                        type="number"
                                        step="0.01"
                                        min={0.01}
                                        className="mt-1 block w-full"
                                        value={data.monto}
                                        onChange={(e) =>
                                            setData('monto', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.monto}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="fecha"
                                        value="Fecha"
                                    />
                                    <TextInput
                                        id="fecha"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.fecha}
                                        onChange={(e) =>
                                            setData('fecha', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.fecha}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Registrar egreso
                                </PrimaryButton>
                                <Link
                                    href={route('egresos.index')}
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
