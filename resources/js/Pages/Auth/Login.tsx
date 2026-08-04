import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    AcademicCapIcon,
    BookOpenIcon,
    BriefcaseIcon,
    ChevronLeftIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserCircleIcon,
} from '@/Components/Icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { UserRole } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ComponentType, FormEventHandler, useState } from 'react';

const roleOptions: {
    value: UserRole;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}[] = [
    {
        value: 'gerencia',
        label: 'Gerencia',
        description: 'Dirección general y control total',
        icon: ShieldCheckIcon,
    },
    {
        value: 'administrativo',
        label: 'Administrativo',
        description: 'Gestión financiera y matrículas',
        icon: BriefcaseIcon,
    },
    {
        value: 'coordinador',
        label: 'Coordinador',
        description: 'Coordinación académica',
        icon: Cog6ToothIcon,
    },
    {
        value: 'academico',
        label: 'Académico',
        description: 'Secciones, evaluaciones y calificaciones',
        icon: BookOpenIcon,
    },
    {
        value: 'docente',
        label: 'Docente',
        description: 'Aula virtual, asistencia y notas',
        icon: AcademicCapIcon,
    },
    {
        value: 'estudiante',
        label: 'Estudiante',
        description: 'Consulta tu progreso académico',
        icon: UserCircleIcon,
    },
];

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            email: '',
            password: '',
            remember: false as boolean,
            role: '' as UserRole | '',
        });

    const chooseRole = (role: UserRole) => {
        clearErrors();
        setSelectedRole(role);
        setData('role', role);
    };

    const changeRole = () => {
        clearErrors();
        setSelectedRole(null);
        setData('role', '');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const selectedOption = roleOptions.find(
        (option) => option.value === selectedRole,
    );

    const registerLink = (
        <p className="mt-6 text-center text-sm text-brand-muted">
            ¿No tienes una cuenta?{' '}
            <Link
                href={route('register')}
                className="font-medium text-brand-navy hover:underline"
            >
                Regístrate
            </Link>
        </p>
    );

    return (
        <GuestLayout>
            <Head title="Iniciar sesión" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {!selectedOption ? (
                <>
                    <h2 className="mb-1 text-lg font-bold text-brand-ink-strong">
                        Iniciar sesión
                    </h2>
                    <p className="mb-6 text-sm text-brand-muted">
                        Elige con qué rol quieres ingresar al sistema.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {roleOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => chooseRole(option.value)}
                                className="flex flex-col items-start gap-2 rounded-[16px] border border-brand-border bg-brand-card p-4 text-left transition hover:border-brand-navy hover:bg-brand-hover"
                            >
                                <option.icon className="size-6 text-brand-navy" />
                                <span className="text-sm font-semibold text-brand-ink-strong">
                                    {option.label}
                                </span>
                                <span className="text-xs leading-snug text-brand-muted">
                                    {option.description}
                                </span>
                            </button>
                        ))}
                    </div>

                    {registerLink}
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={changeRole}
                        className="mb-4 flex items-center gap-1 text-sm text-brand-muted transition hover:text-brand-navy"
                    >
                        <ChevronLeftIcon className="size-4" />
                        Cambiar rol
                    </button>

                    <div className="mb-6 flex items-center gap-3">
                        <selectedOption.icon className="size-7 shrink-0 text-brand-navy" />
                        <div>
                            <h2 className="text-lg font-bold text-brand-ink-strong">
                                Ingresar como {selectedOption.label}
                            </h2>
                            <p className="text-xs text-brand-muted">
                                {selectedOption.description}
                            </p>
                        </div>
                    </div>

                    <InputError message={errors.role} className="mb-4" />

                    <form onSubmit={submit}>
                        <div>
                            <InputLabel
                                htmlFor="email"
                                value="Correo electrónico"
                            />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />

                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Contraseña" />

                            <PasswordInput
                                id="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData(
                                            'remember',
                                            (e.target.checked ||
                                                false) as false,
                                        )
                                    }
                                />
                                <span className="ms-2 text-sm text-brand-muted">
                                    Recordarme
                                </span>
                            </label>
                        </div>

                        <div className="mt-4 flex items-center justify-end">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="rounded-md text-sm text-brand-muted underline hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}

                            <PrimaryButton
                                className="ms-4"
                                disabled={processing}
                            >
                                Iniciar sesión
                            </PrimaryButton>
                        </div>
                    </form>

                    {registerLink}
                </>
            )}
        </GuestLayout>
    );
}
