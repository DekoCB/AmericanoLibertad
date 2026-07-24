import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
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
                    <select
                        id="role"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.role}
                        onChange={(e) =>
                            setData('role', e.target.value as UserRole)
                        }
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {userRoleLabels[role]}
                            </option>
                        ))}
                    </select>
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
                        <select
                            id="teacher_id"
                            className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                            value={data.teacher_id}
                            onChange={(e) =>
                                setData('teacher_id', e.target.value)
                            }
                        >
                            <option value="">Sin vincular</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.first_name} {teacher.last_name}
                                </option>
                            ))}
                        </select>
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
                        <select
                            id="student_id"
                            className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                            value={data.student_id}
                            onChange={(e) =>
                                setData('student_id', e.target.value)
                            }
                        >
                            <option value="">Sin vincular</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name}
                                </option>
                            ))}
                        </select>
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
