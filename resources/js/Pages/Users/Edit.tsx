import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { User, UserRole } from '@/types';
import { userRoleLabels } from '@/types/models';

interface PersonOption {
    id: number;
    first_name: string;
    last_name: string;
}

export default function Edit({
    user,
    roles,
    teachers,
    students,
}: {
    user: User;
    roles: UserRole[];
    teachers: PersonOption[];
    students: PersonOption[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        teacher_id: user.teacher_id ? String(user.teacher_id) : '',
        student_id: user.student_id ? String(user.student_id) : '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editar usuario
                </h2>
            }
        >
            <Head title="Editar usuario" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="name"
                                        value="Nombre completo"
                                    />
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
                                        htmlFor="role"
                                        value="Rol"
                                    />
                                    <select
                                        id="role"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.role}
                                        onChange={(e) =>
                                            setData(
                                                'role',
                                                e.target.value as UserRole,
                                            )
                                        }
                                    >
                                        {roles.map((role) => (
                                            <option key={role} value={role}>
                                                {userRoleLabels[role]}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.role}
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
                                        htmlFor="password"
                                        value="Nueva contraseña (opcional)"
                                    />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        className="mt-1 block w-full"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="mt-2"
                                    />
                                </div>

                                {data.role === 'docente' && (
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            htmlFor="teacher_id"
                                            value="Profesor vinculado"
                                        />
                                        <select
                                            id="teacher_id"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            value={data.teacher_id}
                                            onChange={(e) =>
                                                setData(
                                                    'teacher_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Sin vincular
                                            </option>
                                            {teachers.map((teacher) => (
                                                <option
                                                    key={teacher.id}
                                                    value={teacher.id}
                                                >
                                                    {teacher.first_name}{' '}
                                                    {teacher.last_name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.teacher_id}
                                            className="mt-2"
                                        />
                                    </div>
                                )}

                                {data.role === 'estudiante' && (
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            htmlFor="student_id"
                                            value="Estudiante vinculado"
                                        />
                                        <select
                                            id="student_id"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            value={data.student_id}
                                            onChange={(e) =>
                                                setData(
                                                    'student_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Sin vincular
                                            </option>
                                            {students.map((student) => (
                                                <option
                                                    key={student.id}
                                                    value={student.id}
                                                >
                                                    {student.first_name}{' '}
                                                    {student.last_name}
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
                                    Guardar cambios
                                </PrimaryButton>
                                <Link
                                    href={route('users.index')}
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
