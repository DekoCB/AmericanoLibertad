import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { User, UserRole } from '@/types';
import { userRoleLabels } from '@/types/models';

interface PersonOption {
    id: number;
    first_name: string;
    last_name: string;
}

export default function Form({
    user,
    roles,
    teachers,
    students,
    onSuccess,
    onCancel,
}: {
    user?: User;
    roles: UserRole[];
    teachers: PersonOption[];
    students: PersonOption[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? ('estudiante' as UserRole),
        teacher_id: user?.teacher_id ? String(user.teacher_id) : '',
        student_id: user?.student_id ? String(user.student_id) : '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (user) {
            put(route('users.update', user.id), { onSuccess });
        } else {
            post(route('users.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {user && (
                <div className="flex justify-center">
                    <UserAvatar
                        src={user.avatar_url}
                        size="size-24"
                        iconSize="size-14"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value="Nombre completo" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isFocused
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="role" value="Rol" />
                    <div className="mt-1">
                        <SelectMenu
                            id="role"
                            value={data.role}
                            onChange={(value) =>
                                setData('role', value as UserRole)
                            }
                            options={roles.map((role) => ({
                                value: role,
                                label: userRoleLabels[role],
                            }))}
                        />
                    </div>
                    <InputError message={errors.role} className="mt-2" />
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
                    <InputLabel
                        htmlFor="password"
                        value={
                            user
                                ? 'Nueva contraseña (opcional)'
                                : 'Contraseña'
                        }
                    />
                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={(e) =>
                            setData('password', e.target.value)
                        }
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {data.role === 'docente' && (
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="teacher_id"
                            value="Profesor vinculado"
                        />
                        <SelectMenu
                            id="teacher_id"
                            className="mt-1"
                            value={data.teacher_id}
                            onChange={(value) =>
                                setData('teacher_id', value)
                            }
                            options={[
                                { value: '', label: 'Sin vincular' },
                                ...teachers.map((teacher) => ({
                                    value: String(teacher.id),
                                    label: `${teacher.first_name} ${teacher.last_name}`,
                                })),
                            ]}
                        />
                        <InputError
                            message={errors.teacher_id}
                            className="mt-2"
                        />
                    </div>
                )}

                {user && data.role === 'estudiante' && (
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="student_id"
                            value="Estudiante vinculado"
                        />
                        <SelectMenu
                            id="student_id"
                            className="mt-1"
                            value={data.student_id}
                            onChange={(value) =>
                                setData('student_id', value)
                            }
                            options={[
                                { value: '', label: 'Sin vincular' },
                                ...students.map((student) => ({
                                    value: String(student.id),
                                    label: `${student.first_name} ${student.last_name}`,
                                })),
                            ]}
                        />
                        <InputError
                            message={errors.student_id}
                            className="mt-2"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {user ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
