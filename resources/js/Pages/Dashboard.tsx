import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    AcademicCapIcon,
    ArrowTrendingUpIcon,
    BookOpenIcon,
    BriefcaseIcon,
    CreditCardIcon,
    DocumentTextIcon,
    UsersIcon,
} from '@/Components/Icons';
import UpcomingEvaluationsCard from '@/Components/UpcomingEvaluationsCard';
import UserAvatar from '@/Components/UserAvatar';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Course, Enrollment, Evaluation, Grade, Horario, Student } from '@/types/models';
import { ReactNode } from 'react';

interface TopEstudiante {
    student_id: number;
    promedio: number;
    student?: Student;
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
          upcomingEvaluations: Evaluation[];
      }
    | {
          view: 'docente';
          clima: Clima | null;
          stats: DocenteStats;
          horarioHoy: Horario[];
          topEstudiantes: TopEstudiante[];
          upcomingEvaluations: Evaluation[];
      }
    | {
          view: 'estudiante';
          clima: Clima | null;
          stats: EstudianteStats;
          myCourses: Course[];
          myGrades: Grade[];
          upcomingEvaluations: Evaluation[];
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
                        <div className="absolute -right-5 -top-5 size-16 animate-sun-pulse rounded-full bg-yellow-300/40 blur-lg transition-all duration-300 group-hover:bg-yellow-200/60" />
                        <div className="absolute -right-2 -top-2 size-8 animate-sun-pulse rounded-full bg-yellow-200/60 blur-sm [animation-delay:0.4s]" />
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

function HorarioHoyCard({ horarios }: { horarios: Horario[] }) {
    const diaHoy = capitalize(
        new Date().toLocaleDateString('es-ES', { weekday: 'long' }),
    );

    return (
        <div
            className="rounded-[20px] border bg-brand-card p-[26px_28px]"
            style={{ borderColor: 'var(--brand-border)' }}
        >
            <div className="mb-4 flex items-center justify-between">
                <h3
                    className="text-lg font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
                    Horario de hoy
                </h3>
                <span
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--brand-muted)' }}
                >
                    {diaHoy}
                </span>
            </div>
            <div className="flex flex-col">
                {horarios.map((horario) => {
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
                {horarios.length === 0 && (
                    <EmptyRow>No tienes clases programadas para hoy.</EmptyRow>
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
                    className="mt-1 text-[32px] font-bold"
                    style={{ color: 'var(--brand-ink-strong)' }}
                >
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
            <Head title="Tablero" />

            <div
                className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] px-4 py-9 sm:px-6 lg:px-11 lg:pt-9"
                style={{
                    backgroundColor: 'var(--brand-cream)',
                    color: 'var(--brand-ink)',
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <DashboardHeader title="Tablero" />

                    {props.view === 'staff' && (
                        <div className="space-y-5">
                            <DateCard clima={props.clima} />

                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                                <ColorStat
                                    label="Estudiantes activos"
                                    value={props.stats.activeStudents}
                                    href={route('students.index')}
                                    iconColor="oklch(50% 0.14 350)"
                                    icon={<UsersIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Profesores"
                                    value={props.stats.teachers}
                                    href={route('teachers.index')}
                                    iconColor="oklch(45% 0.13 240)"
                                    icon={<BriefcaseIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Materias"
                                    value={props.stats.subjects}
                                    href={route('subjects.index')}
                                    iconColor="oklch(45% 0.12 155)"
                                    icon={<BookOpenIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Cursos"
                                    value={props.stats.courses}
                                    href={route('courses.index')}
                                    iconColor="oklch(48% 0.14 55)"
                                    icon={<AcademicCapIcon className="size-7" />}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <MiniStat
                                    icon={<CreditCardIcon className="size-6" />}
                                    iconColor="oklch(45% 0.09 85)"
                                    value={props.stats.activeEnrollments}
                                    label="Matrículas activas"
                                />
                                <MiniStat
                                    icon={
                                        <ArrowTrendingUpIcon className="size-6" />
                                    }
                                    iconColor="oklch(42% 0.1 255)"
                                    value={props.stats.averageScore || '—'}
                                    label="Promedio general"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <ListCard title="Matrículas recientes">
                                    {props.recentEnrollments.map(
                                        (enrollment) => (
                                            <div
                                                key={enrollment.id}
                                                className="flex items-center gap-3.5 border-b py-3 last:border-b-0"
                                                style={{
                                                    borderColor:
                                                        'var(--brand-border-faint)',
                                                }}
                                            >
                                                <UserAvatar
                                                    src={
                                                        enrollment.student
                                                            ?.user
                                                            ?.avatar_url
                                                    }
                                                    size="size-[38px]"
                                                    iconSize="size-5"
                                                />
                                                <div>
                                                    <div
                                                        className="font-medium"
                                                        style={{
                                                            color: 'var(--brand-ink-strong)',
                                                        }}
                                                    >
                                                        {
                                                            enrollment.student
                                                                ?.first_name
                                                        }{' '}
                                                        {
                                                            enrollment.student
                                                                ?.last_name
                                                        }
                                                    </div>
                                                    <div
                                                        className="text-[13px]"
                                                        style={{
                                                            color: 'var(--brand-muted-soft)',
                                                        }}
                                                    >
                                                        {
                                                            enrollment.course
                                                                ?.subject?.name
                                                        }{' '}
                                                        —{' '}
                                                        {enrollment.course?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                    {props.recentEnrollments.length === 0 && (
                                        <EmptyRow>
                                            Aún no hay matrículas registradas.
                                        </EmptyRow>
                                    )}
                                </ListCard>

                                <UpcomingEvaluationsCard
                                    evaluations={props.upcomingEvaluations}
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
                                    iconColor="oklch(45% 0.13 240)"
                                    icon={
                                        <AcademicCapIcon className="size-7" />
                                    }
                                />
                                <ColorStat
                                    label="Estudiantes"
                                    value={props.stats.students}
                                    href={route('courses.index')}
                                    iconColor="oklch(50% 0.14 350)"
                                    icon={<UsersIcon className="size-7" />}
                                />
                                <ColorStat
                                    label="Evaluaciones"
                                    value={props.stats.evaluations}
                                    href={route('courses.index')}
                                    iconColor="oklch(48% 0.14 55)"
                                    icon={
                                        <DocumentTextIcon className="size-7" />
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <HorarioHoyCard horarios={props.horarioHoy} />

                                <UpcomingEvaluationsCard
                                    evaluations={props.upcomingEvaluations}
                                />
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
                                    iconColor="oklch(45% 0.13 240)"
                                    icon={
                                        <AcademicCapIcon className="size-7" />
                                    }
                                />
                                <ColorStat
                                    label="Mi promedio"
                                    value={props.stats.averageScore || '—'}
                                    href="#mis-notas"
                                    iconColor="oklch(50% 0.14 350)"
                                    icon={
                                        <ArrowTrendingUpIcon className="size-7" />
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div id="mis-cursos">
                                    <ListCard title="Mis cursos">
                                        {props.myCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="border-b py-3 last:border-b-0"
                                                style={{
                                                    borderColor:
                                                        'var(--brand-border-faint)',
                                                }}
                                            >
                                                <div
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: 'var(--brand-ink-strong)',
                                                    }}
                                                >
                                                    {course.name} —{' '}
                                                    {course.subject?.name}
                                                </div>
                                                <div
                                                    className="text-[13px]"
                                                    style={{
                                                        color: 'var(--brand-muted-soft)',
                                                    }}
                                                >
                                                    {course.teacher
                                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                                        : 'Sin profesor asignado'}
                                                </div>
                                            </div>
                                        ))}
                                        {props.myCourses.length === 0 && (
                                            <EmptyRow>
                                                No tienes cursos matriculados.
                                            </EmptyRow>
                                        )}
                                    </ListCard>
                                </div>

                                <div id="mis-notas">
                                    <ListCard title="Mis calificaciones recientes">
                                        {props.myGrades.map((grade) => (
                                            <div
                                                key={grade.id}
                                                className="flex items-center justify-between border-b py-3 last:border-b-0"
                                                style={{
                                                    borderColor:
                                                        'var(--brand-border-faint)',
                                                }}
                                            >
                                                <div
                                                    className="text-sm"
                                                    style={{
                                                        color: 'var(--brand-ink-strong)',
                                                    }}
                                                >
                                                    {grade.evaluation?.name} —{' '}
                                                    {
                                                        grade.evaluation
                                                            ?.course?.subject
                                                            ?.name
                                                    }
                                                </div>
                                                <div
                                                    className="text-sm font-semibold"
                                                    style={{
                                                        color: 'var(--brand-ink-strong)',
                                                    }}
                                                >
                                                    {grade.score}
                                                </div>
                                            </div>
                                        ))}
                                        {props.myGrades.length === 0 && (
                                            <EmptyRow>
                                                Aún no tienes calificaciones
                                                registradas.
                                            </EmptyRow>
                                        )}
                                    </ListCard>
                                </div>
                            </div>

                            <UpcomingEvaluationsCard
                                evaluations={props.upcomingEvaluations}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
