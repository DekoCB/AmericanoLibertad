import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BriefcaseIcon,
    ClockIcon,
    ComputerDesktopIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    UsersIcon,
} from '@/Components/Icons';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ComponentType, ReactNode } from 'react';

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

const valores = [
    'Responsabilidad',
    'Honestidad',
    'Respeto',
    'Compromiso',
    'Innovación',
    'Trabajo en equipo',
    'Liderazgo',
    'Excelencia',
];

const propuestaValor: {
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
    {
        title: 'Costos accesibles',
        description:
            'Tarifario claro y pensado para acompañar tu crecimiento profesional.',
        icon: BanknotesIcon,
    },
    {
        title: 'Convenios para prácticas',
        description:
            'Alianzas con empresas que facilitan tu inserción en el mundo laboral.',
        icon: ShieldCheckIcon,
    },
    {
        title: 'Acompañamiento académico',
        description:
            'Seguimiento cercano a tu desempeño durante todo el período académico.',
        icon: UsersIcon,
    },
];

function SectionEyebrow({ children }: { children: ReactNode }) {
    return (
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-navy">
            {children}
        </h2>
    );
}

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

            <div className="min-h-screen bg-brand-cream text-brand-ink">
                <header className="border-b border-brand-border-faint bg-brand-card">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo className="size-10 rounded-lg object-contain" />
                            <span className="text-lg font-semibold tracking-tight text-brand-ink-strong">
                                Instituto Americano Libertad
                            </span>
                        </div>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
                                >
                                    Ir al sistema
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="rounded-xl px-4 py-2 text-sm font-medium text-brand-muted transition hover:text-brand-navy"
                                        >
                                            Iniciar sesión
                                        </Link>
                                    )}
                                    <ThemeToggleButton />
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
                                        >
                                            Registrarse
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <section className="relative overflow-hidden bg-brand-navy-dark text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_55%)]" />
                    <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
                            Formando profesionales para un futuro con éxito
                        </p>
                        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
                            Creemos que la educación cambia vidas
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-blue-100">
                            Instituto Superior Tecnológico Privado Americano
                            Libertad: formamos profesionales preparados para
                            afrontar los desafíos del mundo laboral mediante
                            una enseñanza práctica, innovadora y de calidad.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            <Link
                                href={
                                    auth.user
                                        ? route('dashboard')
                                        : route('login')
                                }
                                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-navy-dark shadow-sm transition hover:bg-blue-50"
                            >
                                {auth.user
                                    ? 'Ir al sistema'
                                    : 'Ingresar al sistema'}
                            </Link>
                            <a
                                href="#propuesta"
                                className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-8">
                            <SectionEyebrow>Misión</SectionEyebrow>
                            <p className="mt-3 text-base leading-relaxed text-brand-ink">
                                Brindar educación superior tecnológica de
                                calidad, formando profesionales competentes,
                                éticos e innovadores, comprometidos con el
                                desarrollo de la sociedad mediante una
                                enseñanza práctica y orientada al mercado
                                laboral.
                            </p>
                        </div>
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-8">
                            <SectionEyebrow>Visión</SectionEyebrow>
                            <p className="mt-3 text-base leading-relaxed text-brand-ink">
                                Ser un instituto reconocido a nivel regional y
                                nacional por la excelencia académica, la
                                innovación educativa y la formación integral
                                de profesionales altamente competitivos.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-brand-navy py-16 text-white">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <p className="text-2xl font-bold italic tracking-tight sm:text-3xl">
                            &ldquo;Transformamos tu esfuerzo en
                            oportunidades.&rdquo;
                        </p>
                        <p className="mt-4 text-sm uppercase tracking-widest text-blue-200">
                            Tu éxito comienza aquí · Aprende haciendo ·
                            Estudia, trabaja y crece
                        </p>
                    </div>
                </section>

                <section id="propuesta" className="mx-auto max-w-7xl px-6 py-20">
                    <SectionEyebrow>Propuesta de valor</SectionEyebrow>
                    <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                        Más práctica, más oportunidades
                    </p>

                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {propuestaValor.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-[20px] border border-brand-border bg-brand-card p-6"
                            >
                                <item.icon className="size-7 text-brand-navy" />
                                <h3 className="mt-4 text-lg font-semibold text-brand-ink-strong">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-brand-surface py-20">
                    <div className="mx-auto max-w-7xl px-6">
                        <SectionEyebrow>Nuestros valores</SectionEyebrow>
                        <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                            Lo que guía cada decisión en el instituto
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {valores.map((valor) => (
                                <span
                                    key={valor}
                                    className="rounded-full border border-brand-border bg-brand-card px-4 py-2 text-sm font-medium text-brand-ink-strong"
                                >
                                    {valor}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20">
                    <SectionEyebrow>Nuestra plataforma</SectionEyebrow>
                    <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                        Todo lo que el instituto necesita para gestionar el
                        día a día académico
                    </p>

                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-[20px] border border-brand-border bg-brand-card p-6"
                            >
                                <h3 className="text-lg font-semibold text-brand-ink-strong">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {subjects.length > 0 && (
                    <section
                        id="programas"
                        className="bg-brand-surface py-20"
                    >
                        <div className="mx-auto max-w-7xl px-6">
                            <SectionEyebrow>Oferta académica</SectionEyebrow>
                            <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                                Algunas de nuestras materias
                            </p>

                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {subjects.map((subject) => (
                                    <div
                                        key={subject.name}
                                        className="rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-sm"
                                    >
                                        <h3 className="text-base font-semibold text-brand-ink-strong">
                                            {subject.name}
                                        </h3>
                                        {subject.description && (
                                            <p className="mt-2 text-sm text-brand-muted">
                                                {subject.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <footer className="border-t border-brand-border-faint bg-brand-card">
                    <div className="mx-auto max-w-7xl space-y-4 px-6 py-10 text-sm text-brand-muted">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="size-4 shrink-0" />
                                <span>
                                    Sector Pampa el Toro III – Carretera
                                    Costado de Hospedaje la Hacienda.
                                </span>
                            </div>
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="font-medium text-brand-navy hover:underline"
                                >
                                    Acceso al sistema
                                </Link>
                            )}
                        </div>
                        <div className="border-t border-brand-border-faint pt-4 text-center sm:text-left">
                            © {new Date().getFullYear()} Instituto Superior
                            Tecnológico Privado Americano Libertad. Todos los
                            derechos reservados.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
