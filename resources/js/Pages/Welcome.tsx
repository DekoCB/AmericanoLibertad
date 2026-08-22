import ApplicationLogo from '@/Components/ApplicationLogo';
import PrimaryButton from '@/Components/PrimaryButton';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BeakerIcon,
    BoltIcon,
    BriefcaseIcon,
    CheckBadgeIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    ComputerDesktopIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    FlagIcon,
    HeartIcon,
    LightBulbIcon,
    MapPinIcon,
    PhoneIcon,
    ScaleIcon,
    ShieldCheckIcon,
    StarIcon,
    UsersIcon,
} from '@/Components/Icons';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ComponentType,
    FormEventHandler,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';

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
            'Estudiantes, profesores, cursos y secciones organizados en un solo lugar, con información siempre actualizada.',
        icon: UsersIcon,
    },
    {
        title: 'Matrícula y seguimiento',
        description:
            'Matricula estudiantes en sus secciones y da seguimiento a su desempeño a lo largo del período académico.',
        icon: DocumentTextIcon,
    },
    {
        title: 'Evaluaciones y calificaciones',
        description:
            'Registra evaluaciones, captura calificaciones y consulta promedios de forma clara y ordenada.',
        icon: CheckIcon,
    },
];

const carreraInfo: Record<
    string,
    { icon: ComponentType<{ className?: string }>; description: string }
> = {
    'Enfermería Técnica': {
        icon: HeartIcon,
        description:
            'Formamos profesionales en el cuidado integral del paciente, con práctica clínica real desde los primeros ciclos.',
    },
    'Farmacia Técnica': {
        icon: BeakerIcon,
        description:
            'Aprende el manejo, dispensación y control de medicamentos en farmacias y establecimientos de salud.',
    },
    'Administración de Empresas': {
        icon: BriefcaseIcon,
        description:
            'Desarrolla habilidades en gestión, finanzas y liderazgo para dirigir equipos y negocios.',
    },
    'Contabilidad Técnica': {
        icon: BanknotesIcon,
        description:
            'Domina el registro, control y análisis financiero de empresas, desde la contabilidad general hasta la auditoría.',
    },
    'Fisioterapia y Rehabilitación': {
        icon: BoltIcon,
        description:
            'Técnicas de rehabilitación física y terapéutica para recuperar la movilidad y calidad de vida de los pacientes.',
    },
};

const valores: {
    name: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}[] = [
    {
        name: 'Responsabilidad',
        description:
            'Cumplimos lo que prometemos, con puntualidad y compromiso en cada tarea.',
        icon: CheckBadgeIcon,
    },
    {
        name: 'Honestidad',
        description:
            'Actuamos con transparencia y verdad en cada decisión académica y administrativa.',
        icon: ShieldCheckIcon,
    },
    {
        name: 'Respeto',
        description:
            'Valoramos la diversidad y tratamos a cada persona con dignidad.',
        icon: ScaleIcon,
    },
    {
        name: 'Compromiso',
        description:
            'Nos entregamos por completo a la formación de nuestros estudiantes.',
        icon: HeartIcon,
    },
    {
        name: 'Innovación',
        description:
            'Buscamos nuevas formas de enseñar y de resolver los retos del sector salud y empresarial.',
        icon: LightBulbIcon,
    },
    {
        name: 'Trabajo en equipo',
        description:
            'Logramos más juntos: docentes, estudiantes y personal avanzando en una misma dirección.',
        icon: UsersIcon,
    },
    {
        name: 'Liderazgo',
        description:
            'Formamos personas capaces de guiar equipos y tomar decisiones con seguridad.',
        icon: FlagIcon,
    },
    {
        name: 'Excelencia',
        description:
            'Perseguimos la calidad en cada curso, cada práctica y cada resultado.',
        icon: StarIcon,
    },
];

const galeria: { src: string; caption: string }[] = [
    { src: '/welcome/Enf5.jpeg', caption: 'Campañas de salud escolar' },
    { src: '/welcome/Enf2.jpeg', caption: 'Prácticas de Enfermería' },
    { src: '/welcome/Enf4.jpeg', caption: 'Primeros auxilios' },
    { src: '/welcome/Enf1.jpeg', caption: 'Fisioterapia y Rehabilitación' },
    { src: '/welcome/Enf3.jpeg', caption: 'Bioseguridad y técnica estéril' },
    { src: '/welcome/Food1.jpeg', caption: 'Ferias de nutrición y salud' },
    { src: '/welcome/Out1.jpeg', caption: 'Actividades institucionales' },
    { src: '/welcome/Port4.jpeg', caption: 'Nuestra comunidad educativa' },
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

type HelixConfig = {
    amplitude: number;
    period: number;
    angularSpeed: number;
    xShare: number;
};

const DNA_HELICES_HERO: HelixConfig[] = [
    { amplitude: 58, period: 340, angularSpeed: 0.00028, xShare: -0.05 },
    { amplitude: 48, period: 300, angularSpeed: 0.00036, xShare: 0.22 },
    { amplitude: 66, period: 380, angularSpeed: 0.00022, xShare: 0.46 },
];

const DNA_HELICES_BANNER: HelixConfig[] = [
    { amplitude: 26, period: 190, angularSpeed: 0.00032, xShare: 0.18 },
];

function DnaBackground({
    helices: helixConfigs = DNA_HELICES_HERO,
}: {
    helices?: HelixConfig[];
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !parent || !ctx) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let width = 0;
        let height = 0;

        type Helix = {
            originX: number;
            originY: number;
            dirX: number;
            dirY: number;
            perpX: number;
            perpY: number;
            length: number;
            amplitude: number;
            period: number;
            angularSpeed: number;
            phaseOffset: number;
        };

        let helices: Helix[] = [];

        const ANGLE = (20 * Math.PI) / 180;
        const DIR_X = Math.sin(ANGLE);
        const DIR_Y = Math.cos(ANGLE);
        const PERP_X = Math.cos(ANGLE);
        const PERP_Y = -Math.sin(ANGLE);

        const buildHelices = () => {
            const diag = Math.hypot(width, height);

            helices = helixConfigs.map((cfg, i) => ({
                originX: width * cfg.xShare,
                originY: -height * 0.12,
                dirX: DIR_X,
                dirY: DIR_Y,
                perpX: PERP_X,
                perpY: PERP_Y,
                length: diag * 1.15,
                amplitude: cfg.amplitude,
                period: cfg.period,
                angularSpeed: cfg.angularSpeed,
                phaseOffset: i * 2.4,
            }));
        };

        const resize = () => {
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildHelices();
        };

        resize();
        window.addEventListener('resize', resize);

        const STEP = 5;
        const start = performance.now();
        let raf = 0;

        const render = (time: number) => {
            const elapsed = time - start;
            ctx.clearRect(0, 0, width, height);

            helices.forEach((h) => {
                const steps = Math.ceil(h.length / STEP);
                const endX = h.originX + h.dirX * h.length;
                const endY = h.originY + h.dirY * h.length;

                const gradient = ctx.createLinearGradient(
                    h.originX,
                    h.originY,
                    endX,
                    endY,
                );
                gradient.addColorStop(0, 'rgba(255,255,255,0)');
                gradient.addColorStop(0.16, 'rgba(255,255,255,1)');
                gradient.addColorStop(0.78, 'rgba(255,255,255,1)');
                gradient.addColorStop(1, 'rgba(255,255,255,0)');

                const pointsA: [number, number][] = [];
                const pointsB: [number, number][] = [];

                for (let s = 0; s <= steps; s++) {
                    const t = s * STEP;
                    const cx = h.originX + h.dirX * t;
                    const cy = h.originY + h.dirY * t;
                    const phase =
                        (t / h.period) * Math.PI * 2 -
                        elapsed * h.angularSpeed +
                        h.phaseOffset;
                    const off = Math.cos(phase) * h.amplitude;

                    pointsA.push([cx + h.perpX * off, cy + h.perpY * off]);
                    pointsB.push([cx - h.perpX * off, cy - h.perpY * off]);
                }

                // Peldaños (rungs) cada cuarto de vuelta.
                const rungStep = Math.max(1, Math.round(h.period / STEP / 4));
                ctx.save();
                ctx.strokeStyle = gradient;
                ctx.globalAlpha = 0.22;
                ctx.lineWidth = 2.5;
                for (let s = 0; s < pointsA.length; s += rungStep) {
                    ctx.beginPath();
                    ctx.moveTo(pointsA[s][0], pointsA[s][1]);
                    ctx.lineTo(pointsB[s][0], pointsB[s][1]);
                    ctx.stroke();
                }
                ctx.restore();

                const drawStrand = (pts: [number, number][], alpha: number) => {
                    ctx.save();
                    ctx.strokeStyle = gradient;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 5;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(pts[0][0], pts[0][1]);
                    for (let s = 1; s < pts.length; s++) {
                        ctx.lineTo(pts[s][0], pts[s][1]);
                    }
                    ctx.stroke();
                    ctx.restore();
                };

                drawStrand(pointsA, 0.55);
                drawStrand(pointsB, 0.4);
            });
        };

        const loop = (time: number) => {
            render(time);
            raf = requestAnimationFrame(loop);
        };

        if (prefersReducedMotion) {
            render(0);
        } else {
            raf = requestAnimationFrame(loop);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
        />
    );
}

function Reveal({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-10 opacity-0'
            } ${className}`}
            style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
        >
            {children}
        </div>
    );
}

function Counter({
    value,
    duration = 1400,
}: {
    value: number;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const startedRef = useRef(false);
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(value);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !startedRef.current) {
                    startedRef.current = true;
                    const start = performance.now();

                    const tick = (now: number) => {
                        const progress = Math.min(
                            (now - start) / duration,
                            1,
                        );
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setDisplay(Math.round(value * eased));
                        if (progress < 1) requestAnimationFrame(tick);
                    };

                    requestAnimationFrame(tick);
                    observer.disconnect();
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [value, duration]);

    return <span ref={ref}>{display.toLocaleString('es-PE')}</span>;
}

function SectionEyebrow({ children }: { children: ReactNode }) {
    return (
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-navy">
            {children}
        </h2>
    );
}

function PhotoCarousel({
    photos,
}: {
    photos: { src: string; caption: string }[];
}) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    const goTo = (index: number) => {
        const el = scrollerRef.current;
        if (!el) return;
        const clamped = Math.max(0, Math.min(index, photos.length - 1));
        el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
        setActive(clamped);
    };

    useEffect(() => {
        if (paused) return;
        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const timer = setTimeout(() => {
            goTo(active + 1 >= photos.length ? 0 : active + 1);
        }, 5000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, paused, photos.length]);

    return (
        <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div
                ref={scrollerRef}
                onScroll={(e) => {
                    const el = e.currentTarget;
                    if (el.clientWidth === 0) return;
                    setActive(Math.round(el.scrollLeft / el.clientWidth));
                }}
                className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {photos.map((foto) => (
                    <div
                        key={foto.src}
                        className="relative w-full shrink-0 snap-center overflow-hidden rounded-[24px] border border-brand-border bg-brand-card shadow-sm"
                    >
                        <img
                            src={foto.src}
                            alt={foto.caption}
                            loading="lazy"
                            className="h-[360px] w-full object-cover sm:h-[460px] lg:h-[560px]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <p className="absolute inset-x-0 bottom-0 p-6 text-lg font-semibold text-white sm:text-xl">
                            {foto.caption}
                        </p>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Foto anterior"
                className="absolute left-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/60"
            >
                <ChevronLeftIcon className="size-6" />
            </button>
            <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Foto siguiente"
                className="absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/60"
            >
                <ChevronRightIcon className="size-6" />
            </button>

            <div className="mt-5 flex justify-center gap-2">
                {photos.map((foto, index) => (
                    <button
                        key={foto.src}
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`Ir a la foto ${index + 1}`}
                        className={`h-2 rounded-full transition-all ${
                            index === active
                                ? 'w-6 bg-brand-navy'
                                : 'w-2 bg-brand-border'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

const VALORES_RADIO_PORCENTAJE = 38;

function ValoresWheel() {
    const [activeIndex, setActiveIndex] = useState(0);
    const total = valores.length;
    const anglePerItem = 360 / total;
    const active = valores[activeIndex];

    const goTo = (index: number) => {
        setActiveIndex(((index % total) + total) % total);
    };

    const ArrowButton = ({
        direction,
        className = '',
    }: {
        direction: 'prev' | 'next';
        className?: string;
    }) => (
        <button
            type="button"
            onClick={() => goTo(activeIndex + (direction === 'prev' ? -1 : 1))}
            aria-label={direction === 'prev' ? 'Valor anterior' : 'Siguiente valor'}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-card text-brand-ink shadow-sm transition hover:border-brand-navy hover:text-brand-navy active:scale-95 ${className}`}
        >
            {direction === 'prev' ? (
                <ChevronLeftIcon className="size-5" />
            ) : (
                <ChevronRightIcon className="size-5" />
            )}
        </button>
    );

    return (
        <div className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:gap-16">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10 lg:gap-16">
                <ArrowButton direction="prev" className="hidden sm:flex" />

                <div className="relative">
                    <div
                        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)]"
                        aria-hidden="true"
                    >
                        <div className="size-0 border-x-8 border-t-[10px] border-x-transparent border-t-brand-navy" />
                    </div>

                    <div className="relative size-[280px] rounded-full border border-dashed border-brand-border sm:size-[380px] lg:size-[440px]">
                        {valores.map((valor, index) => {
                            const angleDeg =
                                index * anglePerItem - 90 - activeIndex * anglePerItem;
                            const angleRad = (angleDeg * Math.PI) / 180;
                            const x =
                                VALORES_RADIO_PORCENTAJE * Math.cos(angleRad);
                            const y =
                                VALORES_RADIO_PORCENTAJE * Math.sin(angleRad);
                            const isActive = index === activeIndex;

                            return (
                                <div
                                    key={valor.name}
                                    className="absolute"
                                    style={{
                                        left: `calc(50% + ${x}%)`,
                                        top: `calc(50% + ${y}%)`,
                                        transition:
                                            'left 700ms cubic-bezier(0.16,1,0.3,1), top 700ms cubic-bezier(0.16,1,0.3,1)',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => goTo(index)}
                                        aria-label={valor.name}
                                        aria-current={isActive}
                                        className={`-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                                            isActive
                                                ? 'scale-110 border-brand-navy bg-brand-navy text-white shadow-lg'
                                                : 'scale-100 border-brand-border bg-brand-card text-brand-muted hover:border-brand-navy hover:text-brand-navy'
                                        }`}
                                    >
                                        {valor.name}
                                    </button>
                                </div>
                            );
                        })}

                        <div className="absolute left-1/2 top-1/2 flex size-[140px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-brand-card p-4 text-center shadow-inner sm:size-[190px] sm:p-6 lg:size-[220px]">
                            <div
                                key={activeIndex}
                                className="animate-fade-in-soft flex flex-col items-center"
                            >
                                <active.icon className="size-8 text-brand-navy sm:size-9" />
                                <p className="mt-3 text-sm font-bold text-brand-ink-strong sm:text-base">
                                    {active.name}
                                </p>
                                <p className="mt-1.5 hidden text-xs leading-relaxed text-brand-muted sm:block">
                                    {active.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <ArrowButton direction="next" className="hidden sm:flex" />

                <div className="flex items-center gap-6 sm:hidden">
                    <ArrowButton direction="prev" />
                    <ArrowButton direction="next" />
                </div>
            </div>

            <div
                key={`desc-${activeIndex}`}
                className="animate-fade-in-soft max-w-sm text-center lg:hidden"
            >
                <p className="text-sm leading-relaxed text-brand-muted">
                    {active.description}
                </p>
            </div>
        </div>
    );
}

function ValoresSection() {
    return (
        <section className="bg-brand-surface py-20">
            <div className="mx-auto max-w-7xl px-6 text-center">
                <Reveal>
                    <SectionEyebrow>Nuestros valores</SectionEyebrow>
                    <p className="mx-auto mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                        Lo que guía cada decisión en el instituto
                    </p>
                </Reveal>

                <Reveal delay={100}>
                    <ValoresWheel />
                </Reveal>
            </div>
        </section>
    );
}

const contactInfo = [
    {
        icon: MapPinIcon,
        label: 'Dirección',
        value: 'Sector, Tumán 14601',
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
                <Reveal>
                    <SectionEyebrow>Contacto</SectionEyebrow>
                    <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                        ¿Tienes preguntas? Escríbenos
                    </p>
                </Reveal>

                <Reveal delay={100} className="mt-12 grid gap-12 lg:grid-cols-2">
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
                                src="https://www.google.com/maps?q=Sector+Tum%C3%A1n+14601&output=embed"
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
                                            className="w-full rounded-[12px] border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                            className="w-full rounded-[12px] border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                        className="w-full rounded-[12px] border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                        className="w-full rounded-[12px] border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
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
                                    className="w-full justify-center !rounded-[12px]"
                                >
                                    Enviar mensaje
                                </PrimaryButton>
                            </form>
                        )}
                    </div>
                </Reveal>
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
        'Instituto Superior Tecnológico Privado Americano Libertad: educación técnica superior en Enfermería, Farmacia, Administración y Fisioterapia y Rehabilitación. Horarios flexibles y formación práctica orientada al mercado laboral en Tumán, Perú.';

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
                            streetAddress: 'Sector, Tumán 14601',
                            addressLocality: 'Tumán',
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
                            <ApplicationLogo className="size-10 rounded-[8px] object-contain" />
                            <span className="text-lg font-semibold tracking-tight text-brand-ink-strong">
                                Instituto Americano Libertad
                            </span>
                        </div>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-[12px] bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
                                >
                                    Ir al sistema
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('admision.create')}
                                        className="rounded-[12px] px-4 py-2 text-sm font-medium text-brand-muted transition hover:text-brand-navy"
                                    >
                                        Admisión
                                    </Link>
                                    <ThemeToggleButton className="!rounded-[12px]" />
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="rounded-[12px] bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
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
                    <DnaBackground />
                    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                        <div>
                            <p
                                className="animate-fade-in text-sm font-semibold uppercase tracking-widest text-blue-300 [animation-fill-mode:both]"
                                style={{ animationDelay: '0ms' }}
                            >
                                Formando profesionales para un futuro con éxito
                            </p>
                            <h1
                                className="animate-fade-in mt-4 text-4xl font-bold tracking-tight [animation-fill-mode:both] sm:text-5xl"
                                style={{ animationDelay: '100ms' }}
                            >
                                Creemos que la educación cambia vidas
                            </h1>
                            <p
                                className="animate-fade-in mt-6 max-w-xl text-lg text-blue-100 [animation-fill-mode:both]"
                                style={{ animationDelay: '200ms' }}
                            >
                                Instituto Superior Tecnológico Privado Americano
                                Libertad: formamos profesionales preparados
                                para afrontar los desafíos del mundo laboral
                                mediante una enseñanza práctica, innovadora y de
                                calidad.
                            </p>
                            <div
                                className="animate-fade-in mt-10 flex flex-wrap items-center gap-4 [animation-fill-mode:both]"
                                style={{ animationDelay: '300ms' }}
                            >
                                {!auth.user && (
                                    <Link
                                        href={route('admision.create')}
                                        className="rounded-[12px] bg-white px-6 py-3 text-sm font-semibold text-brand-navy-dark shadow-sm transition hover:bg-blue-50"
                                    >
                                        Solicita tu admisión
                                    </Link>
                                )}
                                <a
                                    href="#contacto"
                                    className="text-sm font-semibold text-blue-200 underline-offset-4 transition hover:text-white hover:underline"
                                >
                                    Solicita información →
                                </a>
                            </div>

                            <dl
                                className="animate-fade-in mt-14 grid max-w-lg grid-cols-3 gap-8 border-t border-white/10 pt-8 [animation-fill-mode:both]"
                                style={{ animationDelay: '400ms' }}
                            >
                                <div>
                                    <dt className="text-sm text-blue-200">
                                        Estudiantes activos
                                    </dt>
                                    <dd className="mt-1 text-3xl font-bold tabular-nums">
                                        <Counter value={stats.students} />
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-blue-200">
                                        Profesores
                                    </dt>
                                    <dd className="mt-1 text-3xl font-bold tabular-nums">
                                        <Counter value={stats.teachers} />
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-blue-200">
                                        Cursos
                                    </dt>
                                    <dd className="mt-1 text-3xl font-bold tabular-nums">
                                        <Counter value={stats.subjects} />
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div
                            className="animate-fade-in relative mx-auto hidden w-full max-w-md [animation-fill-mode:both] lg:block"
                            style={{ animationDelay: '250ms' }}
                        >
                            <div className="overflow-hidden rounded-[24px] border border-white/15 shadow-2xl shadow-black/40 transition-transform duration-500 hover:scale-[1.02]">
                                <img
                                    src="/welcome/Port1.jpeg"
                                    alt="Estudiantes de Enfermería del Instituto Americano Libertad"
                                    className="aspect-[4/5] w-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-12 -left-12 w-44">
                                <img
                                    src="/images/Logo.png"
                                    alt="Instituto Americano Libertad"
                                    className="aspect-square w-full origin-center object-contain drop-shadow-xl transition-transform duration-700 ease-out hover:rotate-[360deg] hover:scale-110"
                                />
                            </div>
                            <div className="absolute -right-4 top-8 rounded-[16px] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                                <p
                                    className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: 'oklch(32% 0.07 255)' }}
                                >
                                    Aprende haciendo
                                </p>
                                <p
                                    className="mt-0.5 text-[13px] font-medium"
                                    style={{ color: 'oklch(25% 0.02 255)' }}
                                >
                                    Formación práctica desde el primer ciclo
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="grid gap-16 sm:gap-20 lg:grid-cols-2">
                        <Reveal>
                            <div
                                className="animate-float"
                                style={{ animationDelay: '0s' }}
                            >
                                <div className="relative mx-auto max-w-lg cursor-default rounded-[62%_38%_37%_63%/45%_42%_58%_55%] border border-brand-border bg-brand-card p-12 shadow-xl shadow-black/5 transition-all duration-300 hover:scale-105 hover:border-brand-navy hover:shadow-2xl sm:p-16">
                                    <SectionEyebrow>Misión</SectionEyebrow>
                                    <p className="mt-3 text-base leading-relaxed text-brand-ink">
                                        Brindar educación superior
                                        tecnológica de calidad, formando
                                        profesionales competentes, éticos e
                                        innovadores, comprometidos con el
                                        desarrollo de la sociedad mediante
                                        una enseñanza práctica y orientada
                                        al mercado laboral.
                                    </p>
                                </div>
                                <div
                                    className="animate-float-shadow mx-auto mt-3 h-5 w-2/3 rounded-full bg-black/25 blur-xl"
                                    style={{ animationDelay: '0s' }}
                                    aria-hidden="true"
                                />
                            </div>
                        </Reveal>
                        <Reveal delay={120}>
                            <div
                                className="animate-float-reverse"
                                style={{ animationDelay: '0.4s' }}
                            >
                                <div className="relative mx-auto max-w-lg cursor-default rounded-[38%_62%_63%_37%/55%_58%_42%_45%] border border-brand-border bg-brand-card p-12 shadow-xl shadow-black/5 transition-all duration-300 hover:scale-105 hover:border-brand-navy hover:shadow-2xl sm:p-16">
                                    <SectionEyebrow>Visión</SectionEyebrow>
                                    <p className="mt-3 text-base leading-relaxed text-brand-ink">
                                        Ser un instituto reconocido a nivel
                                        regional y nacional por la
                                        excelencia académica, la innovación
                                        educativa y la formación integral de
                                        profesionales altamente
                                        competitivos.
                                    </p>
                                </div>
                                <div
                                    className="animate-float-shadow mx-auto mt-3 h-5 w-2/3 rounded-full bg-black/25 blur-xl"
                                    style={{ animationDelay: '0.4s' }}
                                    aria-hidden="true"
                                />
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section
                    className="relative overflow-hidden py-16 text-white"
                    style={{ background: 'var(--brand-hero)' }}
                >
                    <DnaBackground helices={DNA_HELICES_BANNER} />
                    <Reveal className="relative mx-auto max-w-4xl px-6 text-center">
                        <p className="text-2xl font-bold italic tracking-tight sm:text-3xl">
                            &ldquo;Transformamos tu esfuerzo en
                            oportunidades.&rdquo;
                        </p>
                        <p className="mt-4 text-sm uppercase tracking-widest text-blue-200">
                            Tu éxito comienza aquí · Aprende haciendo ·
                            Estudia, trabaja y crece
                        </p>
                    </Reveal>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20">
                    <Reveal>
                        <SectionEyebrow>Vida en el instituto</SectionEyebrow>
                        <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                            Formación real, en el aula y en la comunidad
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
                            Nuestros estudiantes aprenden practicando:
                            prácticas clínicas, campañas de salud y
                            actividades que los preparan para el mundo
                            laboral.
                        </p>
                    </Reveal>

                    <Reveal delay={150} className="mt-12">
                        <PhotoCarousel photos={galeria} />
                    </Reveal>
                </section>

                <section id="propuesta" className="mx-auto max-w-7xl px-6 py-20">
                    <Reveal>
                        <SectionEyebrow>Propuesta de valor</SectionEyebrow>
                        <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                            Más práctica, más oportunidades
                        </p>
                    </Reveal>

                    <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px] lg:items-center xl:grid-cols-[1fr_380px]">
                        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                            {propuestaValor.map((item, index) => (
                                <Reveal
                                    key={item.title}
                                    delay={(index % 3) * 80}
                                    className={
                                        index === propuestaValor.length - 1
                                            ? 'sm:col-span-2 sm:max-w-sm sm:justify-self-center xl:col-span-3'
                                            : ''
                                    }
                                >
                                    <div
                                        className={
                                            index % 2 === 0
                                                ? 'animate-float'
                                                : 'animate-float-reverse'
                                        }
                                        style={{
                                            animationDelay: `${(index % 3) * 0.5}s`,
                                        }}
                                    >
                                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                                            <item.icon className="size-7 text-brand-navy" />
                                            <h3 className="mt-4 text-lg font-semibold text-brand-ink-strong">
                                                {item.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>

                        <Reveal
                            delay={200}
                            className="hidden justify-self-center lg:block"
                        >
                            <div
                                className="animate-float"
                                style={{ animationDelay: '0.2s' }}
                            >
                                <img
                                    src="/images/ISI.png"
                                    alt="Mascota del instituto señalando la propuesta de valor"
                                    className="w-[280px] scale-x-[-1] drop-shadow-2xl xl:w-[360px]"
                                />
                            </div>
                        </Reveal>
                    </div>
                </section>

                <ValoresSection />

                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
                        <Reveal>
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
                        </Reveal>

                        <div className="divide-y divide-brand-border-faint border-t border-brand-border-faint">
                            {features.map((feature, index) => (
                                <Reveal
                                    key={feature.title}
                                    delay={index * 100}
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
                                </Reveal>
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
                            <Reveal>
                                <SectionEyebrow>Oferta académica</SectionEyebrow>
                                <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-brand-ink-strong">
                                    Nuestras carreras técnicas
                                </p>
                            </Reveal>

                            <Reveal
                                delay={100}
                                className="mt-12 overflow-hidden rounded-[20px] border border-brand-border bg-brand-card shadow-sm"
                            >
                                {carreras.map((carrera) => {
                                    const info = carreraInfo[carrera.name];
                                    const Icon = info?.icon ?? AcademicCapIcon;

                                    return (
                                        <div
                                            key={carrera.name}
                                            className="group border-b border-brand-border-faint px-6 py-5 transition-colors last:border-b-0 hover:bg-brand-hover sm:px-8"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <Icon className="size-6 shrink-0 text-brand-navy" />
                                                    <h3 className="text-base font-semibold text-brand-ink-strong">
                                                        {carrera.name}
                                                    </h3>
                                                </div>
                                                <span className="shrink-0 text-sm text-brand-muted">
                                                    {carrera.total_ciclos}{' '}
                                                    ciclos
                                                </span>
                                            </div>

                                            {info && (
                                                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
                                                    <div className="overflow-hidden">
                                                        <p className="max-w-2xl pl-10 pt-3 text-sm leading-relaxed text-brand-muted">
                                                            {info.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </Reveal>
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
                                    Sector, Tumán 14601 · 900 512 553
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
