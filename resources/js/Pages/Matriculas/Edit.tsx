import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Matricula } from '@/types/models';

export default function Edit({ matricula }: { matricula: Matricula }) {
    const { data, setData, put, processing, errors } = useForm({
        ciclo: String(matricula.ciclo),
        turno: matricula.turno,
        period: matricula.period,
        monto_matricula: String(matricula.monto_matricula),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('matriculas.update', matricula.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editar matrícula
                </h2>
            }
        >
            <Head title="Editar matrícula" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                                    <TextInput
                                        id="ciclo"
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="mt-1 block w-full"
                                        value={data.ciclo}
                                        onChange={(e) =>
                                            setData('ciclo', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.ciclo}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="turno" value="Turno" />
                                    <select
                                        id="turno"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.turno}
                                        onChange={(e) =>
                                            setData(
                                                'turno',
                                                e.target.value as Matricula['turno'],
                                            )
                                        }
                                    >
                                        <option value="mañana">Mañana</option>
                                        <option value="tarde">Tarde</option>
                                        <option value="noche">Noche</option>
                                    </select>
                                    <InputError
                                        message={errors.turno}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="period"
                                        value="Periodo"
                                    />
                                    <TextInput
                                        id="period"
                                        className="mt-1 block w-full"
                                        value={data.period}
                                        onChange={(e) =>
                                            setData('period', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.period}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="monto_matricula"
                                        value="Monto de matrícula"
                                    />
                                    <TextInput
                                        id="monto_matricula"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        className="mt-1 block w-full"
                                        value={data.monto_matricula}
                                        onChange={(e) =>
                                            setData(
                                                'monto_matricula',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.monto_matricula}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Guardar cambios
                                </PrimaryButton>
                                <Link
                                    href={route(
                                        'matriculas.show',
                                        matricula.id,
                                    )}
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
