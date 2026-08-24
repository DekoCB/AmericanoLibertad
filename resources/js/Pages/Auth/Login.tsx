import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    AcademicCapIcon,
    BookOpenIcon,
    BriefcaseIcon,
    ChevronLeftIcon,
    ClockIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon,
    UserCircleIcon,
} from '@/Components/Icons';
import { UserRole } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ComponentType, FormEventHandler, useState } from 'react';

const roleOptions: {
    value: UserRole;
    label: string;
    icon: ComponentType<{ className?: string }>;
}[] = [
    { value: 'gerencia', label: 'Gerencia', icon: ShieldCheckIcon },
    { value: 'administrativo', label: 'Secretaría', icon: BriefcaseIcon },
    { value: 'coordinador', label: 'Coordinador', icon: Cog6ToothIcon },
    { value: 'academico', label: 'Académico', icon: BookOpenIcon },
    { value: 'docente', label: 'Docente', icon: AcademicCapIcon },
    { value: 'estudiante', label: 'Estudiante', icon: UserCircleIcon },
];

const highlights: {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}[] = [
    {
        title: 'Carreras con alta demanda',
        description:
            'Programas técnicos alineados a las necesidades reales del mercado laboral.',
        icon: AcademicCapIcon,
    },
    {
        title: 'Docentes especializados',
        description:
            'Profesionales con experiencia práctica en cada área de formación.',
        icon: BriefcaseIcon,
    },
    {
        title: 'Formación práctica',
        description:
            'Aprende haciendo, con talleres y laboratorios orientados a la realidad laboral.',
        icon: ComputerDesktopIcon,
    },
    {
        title: 'Horarios flexibles',
        description:
            'Turnos mañana, tarde y noche pensados para quienes estudian y trabajan.',
        icon: ClockIcon,
    },
];

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [selectedRole, setSelectedRole] = useState<UserRole>('estudiante');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
        role: 'estudiante' as UserRole | '',
    });

    const chooseRole = (role: UserRole) => {
        setSelectedRole(role);
        setData('role', role);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-[oklch(14%_0.02_260)] lg:grid lg:grid-cols-2">
            <Head title="Iniciar sesión" />

            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div
                    className="animate-login-sheen absolute -left-1/2 -top-1/2 h-[200%] w-[200%] mix-blend-screen"
                    style={{
                        background:
                            'linear-gradient(135deg, transparent 44%, rgba(147,197,253,0.14) 48%, rgba(224,236,255,0.22) 50%, rgba(147,197,253,0.14) 52%, transparent 56%)',
                        filter: 'blur(60px)',
                    }}
                />
            </div>

            <div className="relative z-10 hidden overflow-hidden lg:block">
                <img
                    src="/welcome/Enf3.jpeg"
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(8,10,18,0.55) 0%, var(--brand-hero-to) 92%), linear-gradient(90deg, transparent 40%, var(--brand-hero-to) 100%)',
                    }}
                />

                <div className="relative flex h-full flex-col justify-between p-12 text-white">
                    <Link
                        href="/"
                        className="inline-flex w-fit items-center gap-2 text-sm text-white/70 transition hover:text-white"
                    >
                        <ChevronLeftIcon className="size-4" />
                        Volver al sitio web
                    </Link>

                    <div>
                        <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200 backdrop-blur">
                            Instituto Superior
                        </span>
                        <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight tracking-tight">
                            Creemos que la educación cambia vidas
                        </h1>
                        <p className="mt-4 max-w-md text-white/70">
                            Instituto Superior Tecnológico Privado Americano
                            Libertad: formación práctica, innovadora y de
                            calidad para tu futuro profesional.
                        </p>

                        <ul className="mt-10 space-y-5">
                            {highlights.map((item) => (
                                <li
                                    key={item.title}
                                    className="flex items-start gap-3"
                                >
                                    <item.icon className="mt-0.5 size-5 shrink-0 text-blue-300" />
                                    <div>
                                        <p className="font-semibold text-white">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-white/60">
                                            {item.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} Instituto Superior
                        Americano Libertad. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
                <div className="w-full max-w-md">
                    <Link
                        href="/"
                        className="mb-8 flex items-center justify-center gap-3"
                    >
                        <ApplicationLogo className="size-10 rounded-lg object-contain" />
                        <span className="text-lg font-semibold text-white">
                            Instituto Americano Libertad
                        </span>
                    </Link>

                    <div className="rounded-lg border border-white/10 bg-[oklch(17%_0.02_260)] p-6 shadow-2xl shadow-black/40 sm:p-8">
                        <h2 className="text-center text-xl font-bold text-white">
                            Aula Virtual
                        </h2>
                        <p className="mt-1 text-center text-sm text-white/50">
                            Selecciona tu perfil e ingresa tus credenciales
                        </p>

                        {status && (
                            <div className="mt-4 rounded-md bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400">
                                {status}
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-3 gap-2">
                            {roleOptions.map((option) => {
                                const active = option.value === selectedRole;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            chooseRole(option.value)
                                        }
                                        className={`group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-lg px-2 py-3 text-center transition-all duration-300 ease-out ${
                                            active
                                                ? 'bg-white text-[oklch(20%_0.07_255)] shadow-[0_0_22px_rgba(147,197,253,0.45)]'
                                                : 'bg-white/5 text-white/60 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:shadow-[0_0_18px_rgba(147,197,253,0.35)]'
                                        }`}
                                    >
                                        <span
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:animate-shine-scan"
                                            style={{
                                                background:
                                                    'linear-gradient(200deg, transparent 0%, transparent calc(50% - 10px), rgba(255,255,255,0.95) 50%, transparent calc(50% + 10px), transparent 100%)',
                                            }}
                                        />
                                        <option.icon className="size-5" />
                                        <span className="text-xs font-semibold leading-tight">
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {errors.role && (
                            <p className="mt-3 text-sm text-red-400">
                                {errors.role}
                            </p>
                        )}

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-white/80"
                                >
                                    Correo o DNI
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    placeholder="tu@correo.com o 12345678"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-400">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-white/80"
                                >
                                    Contraseña
                                </label>
                                <div className="relative mt-1.5">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        tabIndex={-1}
                                        aria-label={
                                            showPassword
                                                ? 'Ocultar contraseña'
                                                : 'Mostrar contraseña'
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 transition hover:text-white/70"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="size-5" />
                                        ) : (
                                            <EyeIcon className="size-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-white/60">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                'remember',
                                                (e.target.checked ||
                                                    false) as false,
                                            )
                                        }
                                        className="size-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
                                    />
                                    Recordarme
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-[oklch(20%_0.07_255)] transition hover:bg-blue-50 disabled:opacity-60"
                            >
                                Ingresar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
