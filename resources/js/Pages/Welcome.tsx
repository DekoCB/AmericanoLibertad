import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Stats {
    students: number;
    teachers: number;
    subjects: number;
}

interface SubjectPreview {
    name: string;
    description: string | null;
}

const features = [
    {
        title: 'Gestión académica integral',
        description:
            'Estudiantes, profesores, materias y cursos organizados en un solo lugar, con información siempre actualizada.',
    },
    {
        title: 'Matrícula y seguimiento',
        description:
            'Matricula estudiantes en sus cursos y da seguimiento a su desempeño a lo largo del período académico.',
    },
    {
        title: 'Evaluaciones y calificaciones',
        description:
            'Registra evaluaciones, captura calificaciones y consulta promedios de forma clara y ordenada.',
    },
];

export default function Welcome({
    auth,
    canLogin,
    canRegister,
    stats,
    subjects,
}: PageProps<{
    canLogin: boolean;
    canRegister: boolean;
    stats: Stats;
    subjects: SubjectPreview[];
}>) {
    return (
        <>
            <Head title="Instituto Americano Libertad" />

            <div className="min-h-screen bg-white text-slate-900">
                <header className="border-b border-slate-100">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo className="size-10 rounded-lg object-contain" />
                            <span className="text-lg font-semibold tracking-tight">
                                Instituto Americano Libertad
                            </span>
                        </div>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                                >
                                    Ir al sistema
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-800"
                                        >
                                            Iniciar sesión
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                                        >
                                            Registrarse
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <section className="relative overflow-hidden bg-blue-950 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_55%)]" />
                    <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
                            Sistema de gestión educativa
                        </p>
                        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
                            Educación organizada, del aula a la
                            administración
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-blue-100">
                            El Instituto Americano Libertad centraliza la
                            gestión de estudiantes, profesores, cursos y
                            calificaciones en una sola plataforma, pensada
                            para acompañar el crecimiento académico de cada
                            estudiante.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            <Link
                                href={
                                    auth.user
                                        ? route('dashboard')
                                        : route('login')
                                }
                                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50"
                            >
                                {auth.user
                                    ? 'Ir al sistema'
                                    : 'Ingresar al sistema'}
                            </Link>
                            <a
                                href="#programas"
                                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Conocer más
                            </a>
                        </div>

                        <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-10">
                            <div>
                                <dt className="text-sm text-blue-200">
                                    Estudiantes activos
                                </dt>
                                <dd className="mt-1 text-3xl font-bold">
                                    {stats.students}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-blue-200">
                                    Profesores
                                </dt>
                                <dd className="mt-1 text-3xl font-bold">
                                    {stats.teachers}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-blue-200">
                                    Materias
                                </dt>
                                <dd className="mt-1 text-3xl font-bold">
                                    {stats.subjects}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-800">
                        Nuestra plataforma
                    </h2>
                    <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-slate-900">
                        Todo lo que el instituto necesita para gestionar el
                        día a día académico
                    </p>

                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-lg border border-slate-200 p-6"
                            >
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {subjects.length > 0 && (
                    <section
                        id="programas"
                        className="bg-slate-50 py-20"
                    >
                        <div className="mx-auto max-w-7xl px-6">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-800">
                                Oferta académica
                            </h2>
                            <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-slate-900">
                                Algunas de nuestras materias
                            </p>

                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {subjects.map((subject) => (
                                    <div
                                        key={subject.name}
                                        className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
                                    >
                                        <h3 className="text-base font-semibold text-slate-900">
                                            {subject.name}
                                        </h3>
                                        {subject.description && (
                                            <p className="mt-2 text-sm text-slate-600">
                                                {subject.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <footer className="border-t border-slate-100 bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-slate-500">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <span>
                                © {new Date().getFullYear()} Instituto
                                Americano Libertad. Todos los derechos
                                reservados.
                            </span>
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="font-medium text-blue-800 hover:underline"
                                >
                                    Acceso al sistema
                                </Link>
                            )}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
