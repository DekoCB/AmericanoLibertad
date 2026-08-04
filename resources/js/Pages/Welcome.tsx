import ApplicationLogo from '@/Components/ApplicationLogo';
import PrimaryButton from '@/Components/PrimaryButton';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BriefcaseIcon,
    CheckIcon,
    ClockIcon,
    ComputerDesktopIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    ShieldCheckIcon,
    UsersIcon,
} from '@/Components/Icons';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ComponentType, FormEventHandler, ReactNode } from 'react';

interface Stats {
    students: number;
    teachers: number;
    subjects: number;
}

interface CarreraPreview {
    name: string;
    code: string;
    total_ciclos: number;
}

const features = [
    {
        title: 'Gestión académica integral',
        description:
            'Estudiantes, profesores, materias y cursos organizados en un solo lugar, con información siempre actualizada.',
        icon: UsersIcon,
    },
    {
        title: 'Matrícula y seguimiento',
        description:
            'Matricula estudiantes en sus cursos y da seguimiento a su desempeño a lo largo del período académico.',
        icon: DocumentTextIcon,
    },
    {
        title: 'Evaluaciones y calificaciones',
        description:
            'Registra evaluaciones, captura calificaciones y consulta promedios de forma clara y ordenada.',
        icon: CheckIcon,
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

const contactInfo = [
    {
        icon: MapPinIcon,
        label: 'Dirección',
        value: 'Block 11 – #1191, Tumán 14601',
    },
    {
        icon: PhoneIcon,
        label: 'Teléfono',
        value: '900 512 553',
        href: 'tel:+51900512553',
    },
    {
        icon: EnvelopeIcon,
        label: 'Correo',
        value: 'ieslibertadtuman@gmail.com',
        href: 'mailto:ieslibertadtuman@gmail.com',
    },
    {
        icon: ClockIcon,
        label: 'Horario de atención',
        value: 'Lunes a viernes · 8:00 a.m. – 5:00 p.m.',
    },
];

function ContactSection() {
    const { data, setData, post, processing, errors, wasSuccessful, reset } =
        useForm({
            nombre: '',
            correo: '',
            asunto: '',
            mensaje: '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('contacto.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <section id="contacto" className="bg-brand-surface py-20">
            <div className="mx-auto max-w-7xl px-6">
                <SectionEyebrow>Contacto</SectionEyebrow>
                <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                    ¿Tienes preguntas? Escríbenos
                </p>

                <div className="mt-12 grid gap-12 lg:grid-cols-2">
                    <div className="space-y-8">
                        <dl className="space-y-6">
                            {contactInfo.map((item) => (
                                <div key={item.label} className="flex gap-4">
                                    <item.icon className="mt-0.5 size-6 shrink-0 text-brand-navy" />
                                    <div>
                                        <dt className="text-sm font-medium text-brand-muted">
                                            {item.label}
                                        </dt>
                                        <dd className="mt-0.5 text-base font-medium text-brand-ink-strong">
                                            {item.href ? (
                                                <a
                                                    href={item.href}
                                                    className="hover:text-brand-navy"
                                                >
                                                    {item.value}
                                                </a>
                                            ) : (
                                                item.value
                                            )}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </dl>

                        <div className="overflow-hidden rounded-[20px] border border-brand-border">
                            <iframe
                                title="Ubicación del Instituto Americano Libertad"
                                src="https://www.google.com/maps?q=Instituto+Libertad+Block+11+%231191+Tum%C3%A1n+14601&output=embed"
                                className="h-56 w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6 sm:p-8">
                        {wasSuccessful ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckIcon className="size-10 text-brand-navy" />
                                <p className="mt-4 text-lg font-semibold text-brand-ink-strong">
                                    ¡Gracias por escribirnos!
                                </p>
                                <p className="mt-1 text-sm text-brand-muted">
                                    Te responderemos a la brevedad.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-brand-ink-strong">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nombre}
                                            onChange={(e) =>
                                                setData(
                                                    'nombre',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="w-full rounded-xl border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                        />
                                        {errors.nombre && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.nombre}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-brand-ink-strong">
                                            Correo
                                        </label>
                                        <input
                                            type="email"
                                            value={data.correo}
                                            onChange={(e) =>
                                                setData(
                                                    'correo',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="w-full rounded-xl border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                        />
                                        {errors.correo && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.correo}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-brand-ink-strong">
                                        Asunto
                                    </label>
                                    <input
                                        type="text"
                                        value={data.asunto}
                                        onChange={(e) =>
                                            setData('asunto', e.target.value)
                                        }
                                        className="w-full rounded-xl border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-brand-ink-strong">
                                        Mensaje
                                    </label>
                                    <textarea
                                        value={data.mensaje}
                                        onChange={(e) =>
                                            setData('mensaje', e.target.value)
                                        }
                                        required
                                        rows={4}
                                        className="w-full rounded-xl border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                    />
                                    {errors.mensaje && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.mensaje}
                                        </p>
                                    )}
                                </div>

                                <PrimaryButton
                                    type="submit"
                                    disabled={processing}
                                    className="w-full justify-center"
                                >
                                    Enviar mensaje
                                </PrimaryButton>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Welcome({
    auth,
    canLogin,
    stats,
    carreras,
}: PageProps<{
    canLogin: boolean;
    canRegister: boolean;
    stats: Stats;
    carreras: CarreraPreview[];
}>) {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const logoUrl = `${siteUrl}/images/Logo.png`;
    const description =
        'Instituto Superior Tecnológico Privado Americano Libertad: educación técnica superior en Enfermería, Farmacia, Administración y Fisioterapia y Rehabilitación. Horarios flexibles y formación práctica orientada al mercado laboral en Trujillo, Perú.';

    return (
        <>
            <Head title="Instituto Americano Libertad">
                <meta name="description" content={description} />
                <link rel="canonical" href={siteUrl} />

                <meta property="og:type" content="website" />
                <meta
                    property="og:site_name"
                    content="Instituto Americano Libertad"
                />
                <meta
                    property="og:title"
                    content="Instituto Americano Libertad"
                />
                <meta property="og:description" content={description} />
                <meta property="og:url" content={siteUrl} />
                <meta property="og:image" content={logoUrl} />
                <meta property="og:locale" content="es_PE" />

                <meta name="twitter:card" content="summary" />
                <meta
                    name="twitter:title"
                    content="Instituto Americano Libertad"
                />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={logoUrl} />

                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'EducationalOrganization',
                        name: 'Instituto Superior Tecnológico Privado Americano Libertad',
                        alternateName: 'Instituto Americano Libertad',
                        description,
                        url: siteUrl,
                        logo: logoUrl,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: 'Av. España S/N',
                            addressLocality: 'Trujillo',
                            addressCountry: 'PE',
                        },
                        telephone: '+51900512553',
                        email: 'ieslibertadtuman@gmail.com',
                    })}
                </script>
            </Head>

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
                                    <Link
                                        href={route('admision.create')}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-brand-muted transition hover:text-brand-navy"
                                    >
                                        Admisión
                                    </Link>
                                    <ThemeToggleButton />
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
                                        >
                                            Ingresar al sistema
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <section
                    className="relative overflow-hidden text-white"
                    style={{
                        background:
                            'linear-gradient(135deg, var(--brand-hero), var(--brand-hero-to))',
                    }}
                >
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
                            {!auth.user && (
                                <Link
                                    href={route('admision.create')}
                                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-navy-dark shadow-sm transition hover:bg-blue-50"
                                >
                                    Solicita tu admisión
                                </Link>
                            )}
                            <Link
                                href={
                                    auth.user
                                        ? route('dashboard')
                                        : route('login')
                                }
                                className={
                                    auth.user
                                        ? 'rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-navy-dark shadow-sm transition hover:bg-blue-50'
                                        : 'rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
                                }
                            >
                                {auth.user
                                    ? 'Ir al sistema'
                                    : 'Iniciar sesión'}
                            </Link>
                            <a
                                href="#contacto"
                                className="text-sm font-semibold text-blue-200 underline-offset-4 transition hover:text-white hover:underline"
                            >
                                Solicita información →
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

                <section
                    className="py-16 text-white"
                    style={{ background: 'var(--brand-hero)' }}
                >
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
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
                        <div>
                            <SectionEyebrow>Nuestra plataforma</SectionEyebrow>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-brand-ink-strong">
                                Todo lo que el instituto necesita para
                                gestionar el día a día académico
                            </p>
                            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                                Un solo sistema para el área académica,
                                financiera y administrativa del instituto,
                                pensado para el trabajo diario de docentes y
                                personal.
                            </p>
                        </div>

                        <div className="divide-y divide-brand-border-faint border-t border-brand-border-faint">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="flex items-start gap-4 py-6 first:pt-0"
                                >
                                    <feature.icon className="mt-0.5 size-6 shrink-0 text-brand-navy" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-brand-ink-strong">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {carreras.length > 0 && (
                    <section
                        id="programas"
                        className="bg-brand-surface py-20"
                    >
                        <div className="mx-auto max-w-7xl px-6">
                            <SectionEyebrow>Oferta académica</SectionEyebrow>
                            <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                                Nuestras carreras técnicas
                            </p>

                            <div className="mt-12 overflow-hidden rounded-[20px] border border-brand-border bg-brand-card shadow-sm">
                                {carreras.map((carrera) => (
                                    <div
                                        key={carrera.name}
                                        className="flex items-center justify-between gap-4 border-b border-brand-border-faint px-6 py-5 last:border-b-0 sm:px-8"
                                    >
                                        <div className="flex items-center gap-4">
                                            <AcademicCapIcon className="size-6 shrink-0 text-brand-navy" />
                                            <h3 className="text-base font-semibold text-brand-ink-strong">
                                                {carrera.name}
                                            </h3>
                                        </div>
                                        <span className="shrink-0 text-sm text-brand-muted">
                                            {carrera.total_ciclos} ciclos
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <ContactSection />

                <footer className="border-t border-brand-border-faint bg-brand-card">
                    <div className="mx-auto max-w-7xl space-y-4 px-6 py-10 text-sm text-brand-muted">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="size-4 shrink-0" />
                                <span>
                                    Block 11 – #1191, Tumán 14601 · 900 512
                                    553
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
