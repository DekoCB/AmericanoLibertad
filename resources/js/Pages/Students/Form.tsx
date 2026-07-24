import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Carrera, Student } from '@/types/models';

export default function Form({
    student,
    carreras,
    onSuccess,
    onCancel,
}: {
    student?: Student;
    carreras: Carrera[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        document_number: student?.document_number ?? '',
        first_name: student?.first_name ?? '',
        last_name: student?.last_name ?? '',
        email: student?.email ?? '',
        phone: student?.phone ?? '',
        birth_date: student?.birth_date ?? '',
        address: student?.address ?? '',
        status: student?.status ?? 'active',
        carrera_id: student?.carrera_id ? String(student.carrera_id) : '',
        ciclo: student?.ciclo ? String(student.ciclo) : '',
        turno: student?.turno ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (student) {
            put(route('students.update', student.id), { onSuccess });
        } else {
            post(route('students.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {student && (
                <div className="flex justify-center">
                    <UserAvatar
                        src={student.user?.avatar_url}
                        size="size-24"
                        iconSize="size-14"
                    />
                </div>
            )}

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
                            setData('document_number', e.target.value)
                        }
                        isFocused
                    />
                    <InputError
                        message={errors.document_number}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="status" value="Estado" />
                    <select
                        id="status"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.status}
                        onChange={(e) =>
                            setData(
                                'status',
                                e.target.value as Student['status'],
                            )
                        }
                    >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="graduated">Graduado</option>
                    </select>
                    <InputError message={errors.status} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="first_name" value="Nombres" />
                    <TextInput
                        id="first_name"
                        className="mt-1 block w-full"
                        value={data.first_name}
                        onChange={(e) =>
                            setData('first_name', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.first_name}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="last_name" value="Apellidos" />
                    <TextInput
                        id="last_name"
                        className="mt-1 block w-full"
                        value={data.last_name}
                        onChange={(e) =>
                            setData('last_name', e.target.value)
                        }
                    />
                    <InputError message={errors.last_name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Teléfono" />
                    <TextInput
                        id="phone"
                        className="mt-1 block w-full"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                    <InputError message={errors.phone} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="birth_date"
                        value="Fecha de nacimiento"
                    />
                    <DateInput
                        id="birth_date"
                        className="mt-1 block w-full"
                        value={data.birth_date}
                        onChange={(v) => setData('birth_date', v)}
                    />
                    <InputError
                        message={errors.birth_date}
                        className="mt-2"
                    />
                </div>

                <div className="sm:col-span-2">
                    <InputLabel htmlFor="address" value="Dirección" />
                    <TextInput
                        id="address"
                        className="mt-1 block w-full"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                    />
                    <InputError message={errors.address} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="carrera_id" value="Carrera" />
                    <select
                        id="carrera_id"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.carrera_id}
                        onChange={(e) =>
                            setData('carrera_id', e.target.value)
                        }
                    >
                        <option value="">Sin asignar</option>
                        {carreras.map((carrera) => (
                            <option key={carrera.id} value={carrera.id}>
                                {carrera.name}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.carrera_id}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                    <TextInput
                        id="ciclo"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.ciclo}
                        onChange={(e) => setData('ciclo', e.target.value)}
                    />
                    <InputError message={errors.ciclo} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="turno" value="Turno" />
                    <select
                        id="turno"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.turno}
                        onChange={(e) => setData('turno', e.target.value)}
                    >
                        <option value="">Sin asignar</option>
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                        <option value="noche">Noche</option>
                    </select>
                    <InputError message={errors.turno} className="mt-2" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {student ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
