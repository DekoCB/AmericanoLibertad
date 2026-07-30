import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    AcademicCapIcon,
    ArrowTrendingUpIcon,
    BookOpenIcon,
    BriefcaseIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CreditCardIcon,
    DocumentTextIcon,
    HomeIcon,
    UsersIcon,
} from '@/Components/Icons';
import UserAvatar from '@/Components/UserAvatar';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Course,
    DiaSemana,
    diaSemanaLabels,
    Enrollment,
    Evaluation,
    evaluationTypeLabels,
    Grade,
    Horario,
    Student,
} from '@/types/models';
import { ReactNode, useMemo, useRef, useState } from 'react';

interface TopEstudiante {
    student_id: number;
    promedio: number;
    student?: Student;
}

interface EstudiantesPorCarrera {
    carrera: string;
    total: number;
}

interface MatriculasPorCiclo {
    ciclo: number;
    total: number;
}

interface PromedioPorPeriodo {
    periodo: string;
    promedio: number;
}

interface Clima {
    temperatura: number;
    descripcion: string;
    categoria: 'despejado' | 'nublado' | 'neblina' | 'lluvia' | 'nieve' | 'granizo';
    esDeDia: boolean;
}

interface StaffStats {
    students: number;
    activeStudents: number;
    teachers: number;
    subjects: number;
    courses: number;
    activeEnrollments: number;
    averageScore: number;
}

interface DocenteStats {
    courses: number;
    students: number;
    evaluations: number;
}

interface EstudianteStats {
    courses: number;
    averageScore: number;
}

type DashboardProps =
    | {
          view: 'staff';
          clima: Clima | null;
          stats: StaffStats;
          recentEnrollments: Enrollment[];
          evaluacionesCalendario: Evaluation[];
          estudiantesPorCarrera: EstudiantesPorCarrera[];
          matriculasPorCiclo: MatriculasPorCiclo[];
          promedioPorPeriodo: PromedioPorPeriodo[];
      }
    | {
          view: 'docente';
          clima: Clima | null;
          stats: DocenteStats;
          horarioSemana: Horario[];
          topEstudiantes: TopEstudiante[];
          evaluacionesCalendario: Evaluation[];
      }
    | {
          view: 'estudiante';
          clima: Clima | null;
          stats: EstudianteStats;
          myCourses: Course[];
          myGrades: Grade[];
          evaluacionesCalendario: Evaluation[];
      };

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

const STARS = [
    { top: '12%', left: '18%', size: 'size-1', delay: '0s' },
    { top: '22%', left: '78%', size: 'size-1.5', delay: '0.4s' },
    { top: '55%', left: '85%', size: 'size-1', delay: '0.9s' },
    { top: '68%', left: '12%', size: 'size-1', delay: '1.3s' },
    { top: '38%', left: '55%', size: 'size-1.5', delay: '0.7s' },
    { top: '80%', left: '65%', size: 'size-1', delay: '1.7s' },
    { top: '15%', left: '48%', size: 'size-1', delay: '2s' },
];

const RAIN_DROPS = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 9) * 0.09}s`,
}));

const HAIL_STONES = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 41) % 100}%`,
    delay: `${(i % 7) * 0.08}s`,
}));

const SNOW_FLAKES = Array.from({ length: 12 }, (_, i) => ({
    left: `${(i * 43) % 100}%`,
    delay: `${(i % 6) * 0.5}s`,
}));

const CLOUDS = [
    { top: '8%', size: 'h-6 w-16', delay: '-3s', duration: '25s' },
    { top: '14%', size: 'h-7 w-20', delay: '0s', duration: '18s' },
    { top: '32%', size: 'h-5 w-14', delay: '-7s', duration: '24s' },
    { top: '52%', size: 'h-9 w-24', delay: '-14s', duration: '21s' },
    { top: '68%', size: 'h-8 w-24', delay: '-18s', duration: '20s' },
];

function DateCard({ clima }: { clima: Clima | null }) {
    const now = new Date();
    const dayName = capitalize(
        now.toLocaleDateString('es-ES', { weekday: 'long' }),
    );
    const monthYear = capitalize(
        now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    );
    const hour = now.getHours();
    const isDaytime = clima ? clima.esDeDia : hour >= 6 && hour < 19;
    const categoria = clima?.categoria ?? null;

    const imagenFondo =
        categoria === 'neblina'
            ? 'Neblina'
            : categoria === 'lluvia' || categoria === 'granizo'
              ? 'Lluvia'
              : categoria === 'nublado' || categoria === 'nieve'
                ? 'Nublado'
                : isDaytime
                  ? 'Day'
                  : 'Night';

    return (
        <div
            className={`group relative flex min-h-[250px] flex-col items-center justify-center overflow-hidden rounded-3xl text-center text-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${
                isDaytime
                    ? 'hover:shadow-yellow-500/20'
                    : 'hover:shadow-blue-400/30'
            }`}
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                style={{
                    backgroundImage: `url(/images/${imagenFondo}.png)`,
                }}
            />
            <div
                className={`absolute inset-0 ${
                    isDaytime ? 'bg-blue-950/45' : 'bg-black/35'
                }`}
            />

            <div className="pointer-events-none absolute inset-0">
                {categoria === 'lluvia' || categoria === 'granizo' ? (
                    <>
                        {categoria === 'granizo' && (
                            <div className="absolute inset-0 animate-storm-flash bg-white" />
                        )}
                        {RAIN_DROPS.map((drop, i) => (
                            <span
                                key={i}
                                className="absolute h-8 w-px animate-rain-fall bg-blue-100/70"
                                style={{
                                    left: drop.left,
                                    animationDelay: drop.delay,
                                }}
                            />
                        ))}
                        {categoria === 'granizo' &&
                            HAIL_STONES.map((stone, i) => (
                                <span
                                    key={i}
                                    className="absolute size-1.5 animate-hail-fall rounded-full bg-white"
                                    style={{
                                        left: stone.left,
                                        animationDelay: stone.delay,
                                    }}
                                />
                            ))}
                    </>
                ) : categoria === 'nieve' ? (
                    SNOW_FLAKES.map((flake, i) => (
                        <span
                            key={i}
                            className="absolute size-1.5 animate-snow-fall rounded-full bg-white/90"
                            style={{
                                left: flake.left,
                                animationDelay: flake.delay,
                            }}
                        />
                    ))
                ) : categoria === 'nublado' ? (
                    CLOUDS.map((cloud, i) => (
                        <div
                            key={i}
                            className={`absolute animate-cloud-drift rounded-full bg-white/25 blur-md ${cloud.size}`}
                            style={{
                                top: cloud.top,
                                animationDelay: cloud.delay,
                                animationDuration: cloud.duration,
                            }}
                        />
                    ))
                ) : categoria === 'neblina' ? (
                    <div className="absolute inset-x-0 top-1/3 h-1/2 animate-fog-drift bg-gradient-to-r from-white/10 via-white/30 to-white/10" />
                ) : isDaytime ? (
                    <>
                        <div
                            className="absolute size-16 animate-sun-pulse rounded-full bg-yellow-300/40 blur-lg transition-all duration-300 group-hover:bg-yellow-200/60"
                            style={{ left: '15%', top: '-3%' }}
                        />
                        <div
                            className="absolute size-8 animate-sun-pulse rounded-full bg-yellow-200/60 blur-sm [animation-delay:0.4s]"
                            style={{ left: '17.5%', top: '0%' }}
                        />
                    </>
                ) : (
                    STARS.map((star, index) => (
                        <span
                            key={index}
                            className={`absolute animate-twinkle rounded-full bg-white transition-opacity duration-300 group-hover:opacity-100 ${star.size}`}
                            style={{
                                top: star.top,
                                left: star.left,
                                animationDelay: star.delay,
                            }}
                        />
                    ))
                )}
            </div>

            {clima && (
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <span>{clima.temperatura}°C</span>
                    <span className="text-white/60">·</span>
                    <span>{clima.descripcion}</span>
                </div>
            )}

            <div className="relative text-lg font-medium">{dayName}</div>
            <div className="relative text-6xl font-bold leading-tight transition-transform duration-300 ease-out group-hover:scale-110">
                {now.getDate()}
            </div>
            <div className="relative text-base text-blue-100">
                {monthYear}
            </div>
        </div>
    );
}

function ColorStat({
    label,
    value,
    href,
    iconColor,
    icon,
    className = '',
}: {
    label: string;
    value: number | string;
    href: string;
    iconColor: string;
    icon: ReactNode;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-[140px] flex-col justify-between rounded-3xl border bg-brand-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <div
                className="text-[13px] font-medium uppercase tracking-wide"
                style={{ color: 'var(--brand-muted)' }}
            >
                {label}
            </div>
            <div className="mt-3 flex items-center gap-3">
                <span style={{ color: iconColor }}>{icon}</span>
                <span
                    className="text-4xl font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    {value}
                </span>
            </div>
        </Link>
    );
}

function MiniStat({
    icon,
    iconColor,
    value,
    label,
}: {
    icon: ReactNode;
    iconColor: string;
    value: number | string;
    label: string;
}) {
    return (
        <div
            className="flex items-center gap-4 rounded-[20px] border bg-brand-card p-[22px_26px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <span className="shrink-0" style={{ color: iconColor }}>
                {icon}
            </span>
            <div>
                <div
                    className="text-[30px] font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    {value}
                </div>
                <div
                    className="text-sm"
                    style={{ color: 'var(--brand-muted)' }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}

function PromedioGeneralBar({
    value,
    porPeriodo,
}: {
    value: number | string;
    porPeriodo: PromedioPorPeriodo[];
}) {
    return (
        <div
            className="flex flex-wrap items-center gap-6 rounded-[20px] border bg-brand-card p-[22px_26px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <div className="flex shrink-0 items-center gap-4">
                <span style={{ color: 'var(--stat-icon-promedio)' }}>
                    <ArrowTrendingUpIcon className="size-6" />
                </span>
                <div>
                    <div
                        className="text-[30px] font-bold"
                        style={{ color: 'var(--brand-ink-strong)' }}
                    >
                        {value || '—'}
                    </div>
                    <div
                        className="text-sm"
                        style={{ color: 'var(--brand-muted)' }}
                    >
                        Promedio general
                    </div>
                </div>
            </div>

            {porPeriodo.length > 0 && (
                <div className="h-64 min-w-[220px] flex-1">
                    <PromedioLineChart data={porPeriodo} />
                </div>
            )}
        </div>
    );
}

function PromedioLineChart({ data }: { data: PromedioPorPeriodo[] }) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const lastActiveIndexRef = useRef(0);

    if (hoverIndex !== null) {
        lastActiveIndexRef.current = hoverIndex;
    }

    const width = 300;
    const height = 140;
    const paddingX = 16;
    const paddingTop = 16;
    const paddingBottom = 24;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;
    const maxValue = 20;

    const points = data.map((item, index) => {
        const x =
            data.length > 1
                ? paddingX + (index / (data.length - 1)) * chartWidth
                : paddingX + chartWidth / 2;
        const y =
            paddingTop + chartHeight - (item.promedio / maxValue) * chartHeight;
        return { ...item, x, y };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');

    const areaPath =
        points.length > 0
            ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`
            : '';

    const isActive = hoverIndex !== null;
    const active = points[hoverIndex ?? lastActiveIndexRef.current];

    return (
        <div
            className="relative h-full w-full"
            onMouseLeave={() => setHoverIndex(null)}
        >
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="h-full w-full"
            >
                {areaPath && (
                    <path d={areaPath} fill="var(--stat-chart-promedio-area)" />
                )}
                {linePath && (
                    <path
                        d={linePath}
                        fill="none"
                        stroke="var(--stat-chart-promedio)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                <line
                    x1={active.x}
                    y1={paddingTop}
                    x2={active.x}
                    y2={paddingTop + chartHeight}
                    stroke="var(--stat-chart-promedio)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity={isActive ? 0.5 : 0}
                    style={{
                        transition:
                            'x1 0.25s ease, x2 0.25s ease, opacity 0.2s ease',
                    }}
                />
                <circle
                    cx={active.x}
                    cy={active.y}
                    r={4}
                    fill="var(--stat-chart-promedio)"
                    stroke="var(--brand-card)"
                    strokeWidth="1.5"
                    opacity={isActive ? 1 : 0}
                    style={{
                        transition:
                            'cx 0.25s ease, cy 0.25s ease, opacity 0.2s ease',
                    }}
                />

                {points.map((p, index) => (
                    <circle
                        key={p.periodo}
                        cx={p.x}
                        cy={p.y}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoverIndex(index)}
                    />
                ))}
            </svg>

            {points.map((p, index) => (
                <span
                    key={p.periodo}
                    className="pointer-events-none absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[11px]"
                    style={{
                        left: `${(p.x / width) * 100}%`,
                        color:
                            hoverIndex === index
                                ? 'var(--brand-ink-strong)'
                                : 'var(--brand-muted)',
                        fontWeight: hoverIndex === index ? 700 : 400,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {p.periodo}
                </span>
            ))}

            <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-semibold shadow-md"
                style={{
                    left: `${(active.x / width) * 100}%`,
                    top: `${(active.y / height) * 100}%`,
                    marginTop: '-6px',
                    opacity: isActive ? 1 : 0,
                    background: 'var(--brand-card)',
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-ink-strong)',
                    transition: 'left 0.25s ease, top 0.25s ease, opacity 0.2s ease',
                }}
            >
                {active.periodo}: {active.promedio}
            </div>
        </div>
    );
}

function MatriculasActivasCard({
    value,
    porCiclo,
    className = '',
}: {
    value: number | string;
    porCiclo: MatriculasPorCiclo[];
    className?: string;
}) {
    const maxTotal = Math.max(1, ...porCiclo.map((item) => item.total));

    return (
        <div
            className={`flex flex-col rounded-3xl border bg-brand-card p-6 shadow-sm ${className}`}
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <div className="flex items-center gap-3">
                <span style={{ color: 'var(--matriculas-accent)' }}>
                    <CreditCardIcon className="size-7" />
                </span>
                <div>
                    <div
                        className="text-4xl font-bold"
                        style={{ color: 'var(--brand-ink-strong)' }}
                    >
                        {value}
                    </div>
                    <div
                        className="text-[13px] font-medium uppercase tracking-wide"
                        style={{ color: 'var(--brand-muted)' }}
                    >
                        Matrículas activas
                    </div>
                </div>
            </div>

            {porCiclo.length > 0 ? (
                <>
                    <div
                        className="mt-2 text-[13px] font-medium"
                        style={{ color: 'var(--brand-muted-soft)' }}
                    >
                        Matrículas por ciclo
                    </div>
                    <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                        {porCiclo.map((item) => {
                            const alturaPct = Math.max(
                                6,
                                (item.total / maxTotal) * 100,
                            );

                            return (
                                <div
                                    key={item.ciclo}
                                    className="flex flex-1 flex-col items-center gap-2"
                                >
                                    <span
                                        className="text-xs font-semibold"
                                        style={{
                                            color: 'var(--brand-ink-strong)',
                                        }}
                                    >
                                        {item.total}
                                    </span>
                                    <div
                                        className="flex h-32 w-full items-end overflow-hidden rounded-lg"
                                        style={{
                                            background: 'var(--brand-hover)',
                                        }}
                                    >
                                        <div
                                            className="w-full rounded-lg transition-all duration-500"
                                            style={{
                                                height: `${alturaPct}%`,
                                                background:
                                                    'var(--matriculas-accent)',
                                            }}
                                        />
                                    </div>
                                    <span
                                        className="text-[11px]"
                                        style={{ color: 'var(--brand-muted)' }}
                                    >
                                        Ciclo {item.ciclo}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="mt-6 flex flex-1 items-center justify-center">
                    <EmptyRow>Aún no hay matrículas activas.</EmptyRow>
                </div>
            )}
        </div>
    );
}

function ListCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                {title}
            </h3>
            <div className="flex flex-col">{children}</div>
        </div>
    );
}

const ITEMS_POR_PAGINA = 5;

function MisCursosCard({ courses }: { courses: Course[] }) {
    const [page, setPage] = useState(0);
    const totalPages = Math.max(
        1,
        Math.ceil(courses.length / ITEMS_POR_PAGINA),
    );
    const visibles = courses.slice(
        page * ITEMS_POR_PAGINA,
        (page + 1) * ITEMS_POR_PAGINA,
    );

    return (
        <ListCard title="Mis cursos">
            <div key={page} className="animate-fade-in-soft">
                {visibles.map((course) => (
                    <div
                        key={course.id}
                        className="border-b py-3 last:border-b-0"
                        style={{ borderColor: 'var(--brand-border-faint)' }}
                    >
                        <div
                            className="text-sm font-medium"
                            style={{ color: 'var(--brand-ink-strong)' }}
                        >
                            {course.name} — {course.subject?.name}
                        </div>
                        <div
                            className="text-[13px]"
                            style={{ color: 'var(--brand-muted-soft)' }}
                        >
                            {course.teacher
                                ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                : 'Sin profesor asignado'}
                        </div>
                    </div>
                ))}
                {courses.length === 0 && (
                    <EmptyRow>No tienes cursos matriculados.</EmptyRow>
                )}
            </div>
            <CardPager
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />
        </ListCard>
    );
}

function CardPager({
    page,
    totalPages,
    onChange,
}: {
    page: number;
    totalPages: number;
    onChange: (updater: (p: number) => number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-auto flex items-center justify-between pt-4">
            <button
                type="button"
                onClick={() => onChange((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-ink-strong)',
                }}
            >
                <ChevronLeftIcon className="size-3.5" />
                Anterior
            </button>
            <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                Página {page + 1} de {totalPages}
            </span>
            <button
                type="button"
                onClick={() => onChange((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-ink-strong)',
                }}
            >
                Siguiente
                <ChevronRightIcon className="size-3.5" />
            </button>
        </div>
    );
}

function MisCalificacionesCard({ grades }: { grades: Grade[] }) {
    const [page, setPage] = useState(0);
    const totalPages = Math.max(
        1,
        Math.ceil(grades.length / ITEMS_POR_PAGINA),
    );
    const visibles = grades.slice(
        page * ITEMS_POR_PAGINA,
        (page + 1) * ITEMS_POR_PAGINA,
    );

    return (
        <ListCard title="Mis calificaciones recientes">
            <div key={page} className="animate-fade-in-soft">
                {visibles.map((grade) => (
                    <div
                        key={grade.id}
                        className="flex items-center justify-between border-b py-3 last:border-b-0"
                        style={{ borderColor: 'var(--brand-border-faint)' }}
                    >
                        <div
                            className="text-sm"
                            style={{ color: 'var(--brand-ink-strong)' }}
                        >
                            {grade.evaluation?.name} —{' '}
                            {grade.evaluation?.course?.subject?.name}
                        </div>
                        <div
                            className="text-sm font-semibold"
                            style={{ color: 'var(--brand-ink-strong)' }}
                        >
                            {grade.score}
                        </div>
                    </div>
                ))}
                {grades.length === 0 && (
                    <EmptyRow>
                        Aún no tienes calificaciones registradas.
                    </EmptyRow>
                )}
            </div>
            <CardPager
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />
        </ListCard>
    );
}

function MatriculasRecientesCard({
    enrollments,
}: {
    enrollments: Enrollment[];
}) {
    const [page, setPage] = useState(0);
    const totalPages = Math.max(
        1,
        Math.ceil(enrollments.length / ITEMS_POR_PAGINA),
    );
    const visibles = enrollments.slice(
        page * ITEMS_POR_PAGINA,
        (page + 1) * ITEMS_POR_PAGINA,
    );

    return (
        <ListCard title="Matrículas recientes">
            <div key={page} className="animate-fade-in-soft">
                {visibles.map((enrollment) => (
                    <div
                        key={enrollment.id}
                        className="flex items-center gap-3.5 border-b py-3 last:border-b-0"
                        style={{ borderColor: 'var(--brand-border-faint)' }}
                    >
                        <UserAvatar
                            src={enrollment.student?.user?.avatar_url}
                            size="size-[38px]"
                            iconSize="size-5"
                        />
                        <div>
                            <div
                                className="font-medium"
                                style={{ color: 'var(--brand-ink-strong)' }}
                            >
                                {enrollment.student?.first_name}{' '}
                                {enrollment.student?.last_name}
                            </div>
                            <div
                                className="text-[13px]"
                                style={{ color: 'var(--brand-muted-soft)' }}
                            >
                                {enrollment.course?.subject?.name} —{' '}
                                {enrollment.course?.name}
                            </div>
                        </div>
                    </div>
                ))}
                {enrollments.length === 0 && (
                    <EmptyRow>Aún no hay matrículas registradas.</EmptyRow>
                )}
            </div>
            <CardPager
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />
        </ListCard>
    );
}

function EmptyRow({ children }: { children: ReactNode }) {
    return (
        <div
            className="py-4 text-sm"
            style={{ color: 'var(--brand-muted-soft)' }}
        >
            {children}
        </div>
    );
}

const SUBJECT_TAG_PALETTE = [
    { bg: 'oklch(93% 0.05 240)', text: 'oklch(42% 0.1 240)' },
    { bg: 'oklch(93% 0.05 155)', text: 'oklch(42% 0.1 155)' },
    { bg: 'oklch(93% 0.05 350)', text: 'oklch(42% 0.1 350)' },
    { bg: 'oklch(93% 0.05 85)', text: 'oklch(45% 0.09 85)' },
    { bg: 'oklch(93% 0.05 300)', text: 'oklch(45% 0.1 300)' },
];

function subjectTag(subjectId: number) {
    return SUBJECT_TAG_PALETTE[subjectId % SUBJECT_TAG_PALETTE.length];
}

const ORDEN_DIAS: DiaSemana[] = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
];

function diaSemanaActual(): DiaSemana {
    const dias: DiaSemana[] = [
        'domingo',
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
    ];
    return dias[new Date().getDay()];
}

function HorarioHoyCard({ horarios }: { horarios: Horario[] }) {
    const hoy = diaSemanaActual();
    const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>(hoy);

    const horariosDelDia = useMemo(
        () =>
            horarios
                .filter((h) => h.dia_semana === diaSeleccionado)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
        [horarios, diaSeleccionado],
    );

    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                Horario de la semana
            </h3>

            <div className="mb-4 flex flex-wrap gap-1.5">
                {ORDEN_DIAS.map((dia) => {
                    const activo = dia === diaSeleccionado;

                    return (
                        <button
                            key={dia}
                            type="button"
                            onClick={() => setDiaSeleccionado(dia)}
                            className="rounded-full px-3 py-1 text-xs font-semibold transition"
                            style={{
                                background: activo
                                    ? 'var(--brand-navy)'
                                    : 'var(--brand-hover)',
                                color: activo ? '#fff' : 'var(--brand-muted)',
                            }}
                        >
                            {diaSemanaLabels[dia].slice(0, 3)}
                            {dia === hoy && !activo ? ' •' : ''}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col">
                {horariosDelDia.map((horario) => {
                    const tag = subjectTag(horario.course?.subject_id ?? 0);

                    return (
                        <div
                            key={horario.id}
                            className="flex items-center gap-4 border-b py-3 last:border-b-0"
                            style={{ borderColor: 'var(--brand-border-faint)' }}
                        >
                            <div
                                className="w-14 shrink-0 text-sm font-semibold"
                                style={{ color: 'var(--brand-ink-strong)' }}
                            >
                                {horario.hora_inicio.slice(0, 5)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div
                                    className="truncate text-sm font-medium"
                                    style={{ color: 'var(--brand-ink-strong)' }}
                                >
                                    {horario.course?.name}
                                </div>
                                <div
                                    className="text-[13px]"
                                    style={{ color: 'var(--brand-muted-soft)' }}
                                >
                                    {horario.hora_inicio.slice(0, 5)} -{' '}
                                    {horario.hora_fin.slice(0, 5)}
                                    {horario.aula ? ` · ${horario.aula}` : ''}
                                </div>
                            </div>
                            <span
                                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
                                style={{ background: tag.bg, color: tag.text }}
                            >
                                {horario.course?.subject?.name}
                            </span>
                        </div>
                    );
                })}
                {horariosDelDia.length === 0 && (
                    <EmptyRow>No tienes clases programadas este día.</EmptyRow>
                )}
            </div>
        </div>
    );
}

function RankingEstudiantesCard({
    estudiantes,
}: {
    estudiantes: TopEstudiante[];
}) {
    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                Ranking de estudiantes
            </h3>
            <div className="flex flex-col">
                {estudiantes.map((item, index) => (
                    <div
                        key={item.student_id}
                        className="flex items-center gap-3.5 border-b py-3 last:border-b-0"
                        style={{ borderColor: 'var(--brand-border-faint)' }}
                    >
                        <span
                            className="w-5 shrink-0 text-sm font-semibold"
                            style={{ color: 'var(--brand-muted)' }}
                        >
                            {index + 1}
                        </span>
                        <UserAvatar
                            src={item.student?.user?.avatar_url}
                            size="size-9"
                            iconSize="size-5"
                        />
                        <div className="min-w-0 flex-1">
                            <div
                                className="truncate text-sm font-medium"
                                style={{ color: 'var(--brand-ink-strong)' }}
                            >
                                {item.student?.first_name}{' '}
                                {item.student?.last_name}
                            </div>
                        </div>
                        <span
                            className="text-sm font-bold"
                            style={{ color: 'var(--brand-ink-strong)' }}
                        >
                            {item.promedio.toFixed(1)}
                        </span>
                    </div>
                ))}
                {estudiantes.length === 0 && (
                    <EmptyRow>Aún no hay calificaciones registradas.</EmptyRow>
                )}
            </div>
        </div>
    );
}

const DONUT_PALETTE = [
    'var(--chart-pink)',
    'var(--chart-blue)',
    'var(--chart-green)',
    'var(--chart-amber)',
    'var(--chart-purple)',
];

function DonutChart({ data }: { data: EstudiantesPorCarrera[] }) {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    const radio = 46;
    const circunferencia = 2 * Math.PI * radio;
    const espacio = data.length > 1 ? 5 : 0;

    let acumulado = 0;
    const segmentos = data.map((item, index) => {
        const fraccion = total > 0 ? item.total / total : 0;
        const largoBruto = fraccion * circunferencia;
        const largo = Math.max(largoBruto - espacio, 0);
        const dashOffset = -acumulado;
        acumulado += largoBruto;

        return {
            ...item,
            color: DONUT_PALETTE[index % DONUT_PALETTE.length],
            dashArray: `${largo} ${circunferencia - largo}`,
            dashOffset,
        };
    });

    return (
        <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 120 120" className="size-48 -rotate-90">
                <circle
                    cx="60"
                    cy="60"
                    r={radio}
                    fill="none"
                    stroke="var(--brand-border-faint)"
                    strokeWidth="14"
                />
                {segmentos.map((segmento, index) => (
                    <circle
                        key={index}
                        cx="60"
                        cy="60"
                        r={radio}
                        fill="none"
                        stroke={segmento.color}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={segmento.dashArray}
                        strokeDashoffset={segmento.dashOffset}
                    />
                ))}
            </svg>
            <div className="absolute flex flex-col items-center">
                <span
                    className="text-3xl font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    {total}
                </span>
                <span
                    className="text-[11px] uppercase tracking-wide"
                    style={{ color: 'var(--brand-muted)' }}
                >
                    Estudiantes
                </span>
            </div>
        </div>
    );
}

function EstudiantesPorCarreraCard({
    data,
}: {
    data: EstudiantesPorCarrera[];
}) {
    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                Estudiantes por carrera
            </h3>

            {data.length === 0 ? (
                <EmptyRow>Aún no hay matrículas activas.</EmptyRow>
            ) : (
                <>
                    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-2">
                        {data.map((item, index) => (
                            <div
                                key={item.carrera}
                                className="flex items-center gap-1.5 text-[13px]"
                                style={{ color: 'var(--brand-muted)' }}
                            >
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{
                                        background:
                                            DONUT_PALETTE[
                                                index % DONUT_PALETTE.length
                                            ],
                                    }}
                                />
                                {item.carrera}
                            </div>
                        ))}
                    </div>

                    <DonutChart data={data} />

                    <Link
                        href={route('students.index')}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-brand-hover"
                        style={{
                            borderColor: 'var(--brand-border)',
                            color: 'var(--brand-ink-strong)',
                        }}
                    >
                        <UsersIcon className="size-4" />
                        Ver estudiantes
                    </Link>
                </>
            )}
        </div>
    );
}

const DIAS_SEMANA_CALENDARIO = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

const EVALUATION_CALENDAR_COLORS: Record<
    Evaluation['type'],
    { bg: string; text: string }
> = {
    exam: { bg: 'var(--eval-exam-bg)', text: 'var(--eval-exam-text)' },
    quiz: { bg: 'var(--eval-quiz-bg)', text: 'var(--eval-quiz-text)' },
    homework: {
        bg: 'var(--eval-homework-bg)',
        text: 'var(--eval-homework-text)',
    },
    project: { bg: 'var(--eval-project-bg)', text: 'var(--eval-project-text)' },
};

function toFechaKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function EvaluacionesCalendarCard({
    evaluations,
}: {
    evaluations: Evaluation[];
}) {
    const hoy = new Date();
    const [cursor, setCursor] = useState(
        new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    );
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const porFecha = useMemo(() => {
        const map = new Map<string, Evaluation[]>();
        evaluations.forEach((evaluation) => {
            const key = evaluation.date.slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(evaluation);
        });
        return map;
    }, [evaluations]);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
        cells.push({
            date: new Date(year, month - 1, daysInPrevMonth - i),
            inMonth: false,
        });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    let siguiente = 1;
    while (cells.length < 42) {
        cells.push({ date: new Date(year, month + 1, siguiente), inMonth: false });
        siguiente++;
    }

    const monthLabel = capitalize(
        cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    );
    const todayKey = toFechaKey(hoy);
    const seleccionadas = selectedDay ? (porFecha.get(selectedDay) ?? []) : [];

    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <h3
                className="mb-4 text-lg font-bold"
                style={{ color: 'var(--brand-ink-strong)' }}
            >
                Calendario de evaluaciones
            </h3>

            <div className="mb-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => {
                        setCursor(new Date(year, month - 1, 1));
                        setSelectedDay(null);
                    }}
                    className="flex size-7 items-center justify-center rounded-full border transition hover:bg-brand-hover"
                    style={{
                        borderColor: 'var(--brand-border)',
                        color: 'var(--brand-ink-strong)',
                    }}
                    aria-label="Mes anterior"
                >
                    <ChevronLeftIcon className="size-4" />
                </button>
                <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    {monthLabel}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setCursor(new Date(year, month + 1, 1));
                        setSelectedDay(null);
                    }}
                    className="flex size-7 items-center justify-center rounded-full border transition hover:bg-brand-hover"
                    style={{
                        borderColor: 'var(--brand-border)',
                        color: 'var(--brand-ink-strong)',
                    }}
                    aria-label="Mes siguiente"
                >
                    <ChevronRightIcon className="size-4" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {DIAS_SEMANA_CALENDARIO.map((dia) => (
                    <div
                        key={dia}
                        className="pb-1 text-[11px] font-medium uppercase"
                        style={{ color: 'var(--brand-muted)' }}
                    >
                        {dia}
                    </div>
                ))}
                {cells.map(({ date, inMonth }, index) => {
                    const key = toFechaKey(date);
                    const dayEvaluations = porFecha.get(key);
                    const tieneEvaluacion = Boolean(
                        inMonth && dayEvaluations && dayEvaluations.length > 0,
                    );
                    const color = tieneEvaluacion
                        ? EVALUATION_CALENDAR_COLORS[dayEvaluations![0].type]
                        : null;
                    const esHoy = key === todayKey;
                    const seleccionado = key === selectedDay;

                    return (
                        <button
                            type="button"
                            key={index}
                            disabled={!tieneEvaluacion}
                            onClick={() =>
                                setSelectedDay(seleccionado ? null : key)
                            }
                            className={`relative flex h-9 items-center justify-center rounded-lg text-[13px] transition ${
                                !inMonth ? 'opacity-35' : ''
                            } ${tieneEvaluacion ? 'cursor-pointer font-bold' : 'cursor-default'}`}
                            style={{
                                background: tieneEvaluacion
                                    ? color!.bg
                                    : 'transparent',
                                color: tieneEvaluacion
                                    ? color!.text
                                    : 'var(--brand-ink)',
                                boxShadow: seleccionado
                                    ? 'inset 0 0 0 2px var(--brand-navy)'
                                    : 'none',
                            }}
                        >
                            {date.getDate()}
                            {esHoy && (
                                <span
                                    className="absolute bottom-0.5 size-1 rounded-full"
                                    style={{
                                        background: tieneEvaluacion
                                            ? color!.text
                                            : 'var(--brand-navy)',
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div
                className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4"
                style={{ borderColor: 'var(--brand-border-faint)' }}
            >
                {(
                    Object.keys(evaluationTypeLabels) as Evaluation['type'][]
                ).map((tipo) => (
                    <div
                        key={tipo}
                        className="flex items-center gap-1.5 text-[12px]"
                        style={{ color: 'var(--brand-muted)' }}
                    >
                        <span
                            className="size-2 rounded-full"
                            style={{
                                background:
                                    EVALUATION_CALENDAR_COLORS[tipo].bg,
                            }}
                        />
                        {evaluationTypeLabels[tipo]}
                    </div>
                ))}
            </div>

            {selectedDay && (
                <div
                    className="mt-4 space-y-2 border-t pt-4"
                    style={{ borderColor: 'var(--brand-border-faint)' }}
                >
                    {seleccionadas.map((evaluacion) => (
                        <div key={evaluacion.id} className="text-[13px]">
                            <Link
                                href={route(
                                    'courses.show',
                                    evaluacion.course_id,
                                )}
                                className="font-medium hover:underline"
                                style={{ color: 'var(--brand-ink-strong)' }}
                            >
                                {evaluacion.name}
                            </Link>
                            <span style={{ color: 'var(--brand-muted-soft)' }}>
                                {' '}
                                — {evaluacion.course?.subject?.name} ·{' '}
                                {evaluationTypeLabels[evaluacion.type]}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DashboardHeader({ title }: { title: string }) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
                <div
                    className="text-[13px] font-medium uppercase tracking-[.08em]"
                    style={{ color: 'var(--brand-muted-soft)' }}
                >
                    Instituto Educativo Superior Americano Libertad
                </div>
                <h1
                    className="mt-1 flex items-center gap-3 text-[32px] font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    <HomeIcon className="size-7" style={{ color: 'var(--brand-muted)' }} />
                    {title}
                </h1>
            </div>
            <div
                className="flex items-center gap-2.5 rounded-full border bg-brand-card px-4 py-2"
                style={{ borderColor: 'var(--brand-border)' }}
            >
                {auth.user.avatar_url ? (
                    <img
                        src={auth.user.avatar_url}
                        alt="Foto de perfil"
                        className="size-[34px] shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                            background: 'oklch(90% 0.06 85)',
                            color: 'oklch(35% 0.08 85)',
                        }}
                    >
                        {initials(auth.user.name)}
                    </div>
                )}
                <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--brand-ink-soft)' }}
                >
                    Bienvenido/a, {auth.user.name}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard(props: DashboardProps) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div
                className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] px-4 py-9 sm:px-6 lg:px-11 lg:pt-9"
                style={{
                    backgroundColor: 'var(--brand-cream)',
                    color: 'var(--brand-ink)',
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <DashboardHeader title="Dashboard" />

                    {props.view === 'staff' && (
                        <div className="space-y-5">
                            <DateCard clima={props.clima} />

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <MatriculasActivasCard
                                    value={props.stats.activeEnrollments}
                                    porCiclo={props.matriculasPorCiclo}
                                    className="lg:row-span-2"
                                />
                                <ColorStat
                                    label="Estudiantes activos"
                                    value={props.stats.activeStudents}
                                    href={route('students.index')}
                                    iconColor="var(--stat-icon-pink)"
                                    icon={<UsersIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Profesores"
                                    value={props.stats.teachers}
                                    href={route('teachers.index')}
                                    iconColor="var(--stat-icon-blue)"
                                    icon={<BriefcaseIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Materias"
                                    value={props.stats.subjects}
                                    href={route('subjects.index')}
                                    iconColor="var(--stat-icon-green)"
                                    icon={<BookOpenIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Cursos"
                                    value={props.stats.courses}
                                    href={route('courses.index')}
                                    iconColor="var(--stat-icon-amber)"
                                    icon={<AcademicCapIcon className="size-7" />}
                                />
                            </div>

                            <PromedioGeneralBar
                                value={props.stats.averageScore}
                                porPeriodo={props.promedioPorPeriodo}
                            />

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                <EvaluacionesCalendarCard
                                    evaluations={props.evaluacionesCalendario}
                                />

                                <EstudiantesPorCarreraCard
                                    data={props.estudiantesPorCarrera}
                                />

                                <MatriculasRecientesCard
                                    enrollments={props.recentEnrollments}
                                />
                            </div>
                        </div>
                    )}

                    {props.view === 'docente' && (
                        <div className="space-y-5">
                            <DateCard clima={props.clima} />

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                <ColorStat
                                    label="Mis cursos"
                                    value={props.stats.courses}
                                    href={route('courses.index')}
                                    iconColor="var(--stat-icon-blue)"
                                    icon={
                                        <AcademicCapIcon className="size-7" />
                                    }
                                />
                                <ColorStat
                                    label="Estudiantes"
                                    value={props.stats.students}
                                    href={route('courses.index')}
                                    iconColor="var(--stat-icon-pink)"
                                    icon={<UsersIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Evaluaciones"
                                    value={props.stats.evaluations}
                                    href={route('courses.index')}
                                    iconColor="var(--stat-icon-amber)"
                                    icon={
                                        <DocumentTextIcon className="size-7" />
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <EvaluacionesCalendarCard
                                    evaluations={props.evaluacionesCalendario}
                                />

                                <HorarioHoyCard horarios={props.horarioSemana} />
                            </div>

                            <RankingEstudiantesCard
                                estudiantes={props.topEstudiantes}
                            />
                        </div>
                    )}

                    {props.view === 'estudiante' && (
                        <div className="space-y-5">
                            <DateCard clima={props.clima} />

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <ColorStat
                                    label="Mis cursos"
                                    value={props.stats.courses}
                                    href="#mis-cursos"
                                    iconColor="var(--stat-icon-blue)"
                                    icon={
                                        <AcademicCapIcon className="size-7" />
                                    }
                                />
                                <ColorStat
                                    label="Mi promedio"
                                    value={props.stats.averageScore || '—'}
                                    href="#mis-notas"
                                    iconColor="var(--stat-icon-pink)"
                                    icon={
                                        <ArrowTrendingUpIcon className="size-7" />
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                <EvaluacionesCalendarCard
                                    evaluations={props.evaluacionesCalendario}
                                />

                                <div id="mis-cursos">
                                    <MisCursosCard courses={props.myCourses} />
                                </div>

                                <div id="mis-notas">
                                    <MisCalificacionesCard
                                        grades={props.myGrades}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
