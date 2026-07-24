import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MultiSelect from '@/Components/MultiSelect';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Teacher } from '@/types/models';

export default function Form({
    teacher,
    specialties,
    onSuccess,
    onCancel,
}: {
    teacher?: Teacher;
    specialties: string[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        first_name: teacher?.first_name ?? '',
        last_name: teacher?.last_name ?? '',
        email: teacher?.email ?? '',
        phone: teacher?.phone ?? '',
        specialty: teacher?.specialty ?? ([] as string[]),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (teacher) {
            put(route('teachers.update', teacher.id), { onSuccess });
        } else {
            post(route('teachers.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {teacher && (
                <div className="flex justify-center">
                    <UserAvatar
                        src={teacher.user?.avatar_url}
                        size="size-24"
                        iconSize="size-14"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="first_name" value="Nombres" />
                    <TextInput
                        id="first_name"
                        className="mt-1 block w-full"
                        value={data.first_name}
                        onChange={(e) =>
                            setData('first_name', e.target.value)
                        }
                        isFocused
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

                <div className="sm:col-span-2">
                    <InputLabel
                        htmlFor="specialty"
                        value="Especialidades"
                    />
                    <MultiSelect
                        value={data.specialty}
                        onChange={(tags) => setData('specialty', tags)}
                        options={specialties}
                        placeholder="Seleccionar especialidades..."
                    />
                    <InputError
                        message={errors.specialty}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {teacher ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
