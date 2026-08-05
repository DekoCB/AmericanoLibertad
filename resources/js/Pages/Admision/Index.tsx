import ApplicationLogo from '@/Components/ApplicationLogo';
import DateInput from '@/Components/DateInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SelectMenu from '@/Components/SelectMenu';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import { CheckIcon, ChevronLeftIcon } from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    cloneElement,
    FormEventHandler,
    isValidElement,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

interface CarreraOption {
    id: number;
    name: string;
}

const steps = ['Estudiante', 'Apoderado', 'Documentos'] as const;

const inputClass =
    'w-full rounded-xl border-brand-border bg-brand-input text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy';

function ParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let width = 0;
        let height = 0;
        let isDark = document.documentElement.classList.contains('dark');

        type Particle = {
            x: number;
            y: number;
            radius: number;
            speed: number;
            drift: number;
            driftSpeed: number;
            phase: number;
            baseOpacity: number;
        };

        let particles: Particle[] = [];

        const rand = (min: number, max: number) => min + Math.random() * (max - min);

        const buildParticles = () => {
            const count = Math.min(80, Math.round((width * height) / 16000));
            particles = Array.from({ length: count }, () => ({
                x: rand(0, width),
                y: rand(0, height),
                radius: rand(1.2, 3.6),
                speed: rand(14, 34),
                drift: rand(-1, 1),
                driftSpeed: rand(0.3, 0.9),
                phase: rand(0, Math.PI * 2),
                baseOpacity: rand(0.25, 0.65),
            }));
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildParticles();
        };

        resize();
        window.addEventListener('resize', resize);

        const themeObserver = new MutationObserver(() => {
            isDark = document.documentElement.classList.contains('dark');
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const drawFrame = () => {
            const color = isDark ? '191,219,254' : '30,58,95';
            const fadeZone = 70;

            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                const x = p.x + Math.sin(p.phase) * 18 * p.drift;

                let opacity = p.baseOpacity;
                if (p.y > height - fadeZone) {
                    opacity *= Math.max(0, (height - p.y) / fadeZone);
                } else if (p.y < fadeZone) {
                    opacity *= Math.max(0, p.y / fadeZone);
                }

                ctx.beginPath();
                ctx.fillStyle = `rgba(${color},${opacity})`;
                ctx.arc(x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        let raf = 0;
        let last = performance.now();

        const loop = (time: number) => {
            const dt = Math.min((time - last) / 1000, 0.05);
            last = time;

            particles.forEach((p) => {
                p.y -= p.speed * dt;
                p.phase += p.driftSpeed * dt;

                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = rand(0, width);
                }
            });

            drawFrame();
            raf = requestAnimationFrame(loop);
        };

        if (prefersReducedMotion) {
            drawFrame();
        } else {
            raf = requestAnimationFrame(loop);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            themeObserver.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10"
        />
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    const id = useId();

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1 block text-sm font-medium text-brand-ink-strong"
            >
                {label}
                {required && <span className="text-brand-navy"> *</span>}
            </label>
            {isValidElement<{ id?: string }>(children)
                ? cloneElement(children, { id })
                : children}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default function AdmisionIndex({
    carreras,
}: {
    carreras: CarreraOption[];
}) {
    const [step, setStep] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);

    const { data, setData, post, processing, errors, wasSuccessful } =
        useForm({
            apellido_paterno: '',
            apellido_materno: '',
            nombres: '',
            dni: '',
            sexo: 'masculino',
            fecha_nacimiento: '',
            telefono: '',
            correo: '',
            carrera_id: '',
            turno: 'mañana',
            colegio_procedencia: '',
            lugar_procedencia: '',
            apoderado_nombres: '',
            apoderado_dni: '',
            apoderado_parentesco: '',
            apoderado_telefono: '',
            apoderado_correo: '',
            documento_dni: null as File | null,
            documento_certificado: null as File | null,
            documento_partida: null as File | null,
            documento_foto: null as File | null,
        });

    const goNext = () => {
        if (formRef.current?.reportValidity()) {
            setStep((s) => Math.min(s + 1, steps.length - 1));
        }
    };

    const goBack = () => setStep((s) => Math.max(s - 1, 0));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admision.store'), { forceFormData: true });
    };

    return (
        <>
            <Head title="Solicita tu admisión" />

            <div className="pointer-events-none fixed inset-0 -z-20 bg-brand-cream" />
            <ParticlesBackground />

            <div className="min-h-screen text-brand-ink">
                <header className="border-b border-brand-border-faint bg-brand-card">
                    <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="size-10 rounded-lg object-contain" />
                            <span className="text-lg font-semibold tracking-tight text-brand-ink-strong">
                                Instituto Americano Libertad
                            </span>
                        </Link>
                        <ThemeToggleButton />
                    </div>
                </header>

                <div className="hidden xl:fixed xl:right-12 xl:top-1/3 xl:block">
                    <div className="animate-float" style={{ animationDelay: '0.2s' }}>
                        <img
                            src="/images/ISI2.png"
                            alt="Mascota del instituto invitándote a postular"
                            className="w-[240px] drop-shadow-2xl 2xl:w-[280px]"
                        />
                    </div>
                </div>

                <div className="mx-auto max-w-4xl px-6 py-12">
                    <Link
                        href="/"
                        className="mb-4 flex items-center gap-1 text-sm text-brand-muted transition hover:text-brand-navy"
                    >
                        <ChevronLeftIcon className="size-4" />
                        Volver a inicio
                    </Link>

                    <p className="text-sm font-semibold uppercase tracking-widest text-brand-navy">
                        Admisión {new Date().getFullYear()}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink-strong">
                        Solicita tu admisión
                    </h1>
                    <p className="mt-2 max-w-2xl text-brand-muted">
                        Completa el formulario y nuestro equipo de admisión se
                        pondrá en contacto contigo para continuar con tu
                        proceso de matrícula.
                    </p>

                    <div className="mt-10 rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-sm sm:p-10">
                        {wasSuccessful ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <div className="flex size-16 items-center justify-center rounded-full bg-brand-hover">
                                    <CheckIcon className="size-8 text-brand-navy" />
                                </div>
                                <p className="mt-6 text-xl font-semibold text-brand-ink-strong">
                                    ¡Tu solicitud fue enviada!
                                </p>
                                <p className="mt-2 max-w-sm text-sm text-brand-muted">
                                    Nos pondremos en contacto contigo al
                                    teléfono o correo que registraste para
                                    continuar con tu proceso de admisión.
                                </p>
                                <Link href="/" className="mt-8">
                                    <PrimaryButton type="button">
                                        Volver al inicio
                                    </PrimaryButton>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Step indicator */}
                                <div className="mb-10 flex items-center">
                                    {steps.map((label, index) => (
                                        <div
                                            key={label}
                                            className="flex flex-1 items-center last:flex-none"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div
                                                    className="flex size-9 items-center justify-center rounded-full text-sm font-bold transition"
                                                    style={{
                                                        background:
                                                            index <= step
                                                                ? 'var(--brand-navy)'
                                                                : 'var(--brand-hover)',
                                                        color:
                                                            index <= step
                                                                ? '#fff'
                                                                : 'var(--brand-muted)',
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{
                                                        color:
                                                            index === step
                                                                ? 'var(--brand-navy)'
                                                                : 'var(--brand-muted)',
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div
                                                    className="mx-2 mt-[-20px] h-px flex-1"
                                                    style={{
                                                        background:
                                                            index < step
                                                                ? 'var(--brand-navy)'
                                                                : 'var(--brand-border)',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <form ref={formRef} onSubmit={submit}>
                                    {step === 0 && (
                                        <div className="space-y-5">
                                            <div className="grid gap-5 sm:grid-cols-3">
                                                <Field
                                                    label="Apellido paterno"
                                                    required
                                                    error={
                                                        errors.apellido_paterno
                                                    }
                                                >
                                                    <input
                                                        required
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apellido_paterno
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apellido_paterno',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label="Apellido materno"
                                                    required
                                                    error={
                                                        errors.apellido_materno
                                                    }
                                                >
                                                    <input
                                                        required
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apellido_materno
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apellido_materno',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label="Nombres"
                                                    required
                                                    error={errors.nombres}
                                                >
                                                    <input
                                                        required
                                                        className={
                                                            inputClass
                                                        }
                                                        value={data.nombres}
                                                        onChange={(e) =>
                                                            setData(
                                                                'nombres',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field
                                                    label="DNI"
                                                    required
                                                    error={errors.dni}
                                                >
                                                    <input
                                                        required
                                                        maxLength={15}
                                                        className={
                                                            inputClass
                                                        }
                                                        value={data.dni}
                                                        onChange={(e) =>
                                                            setData(
                                                                'dni',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Fecha de nacimiento">
                                                    <DateInput
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.fecha_nacimiento
                                                        }
                                                        onChange={(iso) =>
                                                            setData(
                                                                'fecha_nacimiento',
                                                                iso,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>

                                            <Field label="Sexo" required>
                                                <div className="flex gap-3">
                                                    {(
                                                        [
                                                            'masculino',
                                                            'femenino',
                                                        ] as const
                                                    ).map((opcion) => (
                                                        <button
                                                            key={opcion}
                                                            type="button"
                                                            onClick={() =>
                                                                setData(
                                                                    'sexo',
                                                                    opcion,
                                                                )
                                                            }
                                                            className="flex-1 rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition"
                                                            style={{
                                                                background:
                                                                    data.sexo ===
                                                                    opcion
                                                                        ? 'var(--brand-navy)'
                                                                        : 'var(--brand-input)',
                                                                color:
                                                                    data.sexo ===
                                                                    opcion
                                                                        ? '#fff'
                                                                        : 'var(--brand-ink-strong)',
                                                                borderColor:
                                                                    'var(--brand-border)',
                                                            }}
                                                        >
                                                            {opcion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Field>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field label="Teléfono">
                                                    <input
                                                        type="tel"
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.telefono
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'telefono',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Correo">
                                                    <input
                                                        type="email"
                                                        className={
                                                            inputClass
                                                        }
                                                        value={data.correo}
                                                        onChange={(e) =>
                                                            setData(
                                                                'correo',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field
                                                    label="Carrera de interés"
                                                    required
                                                    error={
                                                        errors.carrera_id
                                                    }
                                                >
                                                    <select
                                                        required
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.carrera_id
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'carrera_id',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Selecciona una
                                                            carrera
                                                        </option>
                                                        {carreras.map(
                                                            (carrera) => (
                                                                <option
                                                                    key={
                                                                        carrera.id
                                                                    }
                                                                    value={
                                                                        carrera.id
                                                                    }
                                                                >
                                                                    {
                                                                        carrera.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Field>
                                                <Field label="Turno preferido" required>
                                                    <SelectMenu
                                                        value={data.turno}
                                                        onChange={(value) =>
                                                            setData(
                                                                'turno',
                                                                value,
                                                            )
                                                        }
                                                        options={[
                                                            {
                                                                value: 'mañana',
                                                                label: 'Mañana',
                                                            },
                                                            {
                                                                value: 'tarde',
                                                                label: 'Tarde',
                                                            },
                                                            {
                                                                value: 'noche',
                                                                label: 'Noche',
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field label="Colegio de procedencia">
                                                    <input
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.colegio_procedencia
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'colegio_procedencia',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Lugar de procedencia">
                                                    <input
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.lugar_procedencia
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'lugar_procedencia',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    )}

                                    {step === 1 && (
                                        <div className="space-y-5">
                                            <p className="text-sm text-brand-muted">
                                                Datos de tu padre, madre o
                                                apoderado. Este paso es
                                                opcional.
                                            </p>
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field label="Nombres completos">
                                                    <input
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apoderado_nombres
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apoderado_nombres',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="DNI">
                                                    <input
                                                        maxLength={15}
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apoderado_dni
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apoderado_dni',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                            <div className="grid gap-5 sm:grid-cols-3">
                                                <Field label="Parentesco">
                                                    <SelectMenu
                                                        value={
                                                            data.apoderado_parentesco
                                                        }
                                                        onChange={(value) =>
                                                            setData(
                                                                'apoderado_parentesco',
                                                                value,
                                                            )
                                                        }
                                                        options={[
                                                            {
                                                                value: '',
                                                                label: 'Selecciona',
                                                            },
                                                            {
                                                                value: 'Padre',
                                                                label: 'Padre',
                                                            },
                                                            {
                                                                value: 'Madre',
                                                                label: 'Madre',
                                                            },
                                                            {
                                                                value: 'Hermano(a)',
                                                                label: 'Hermano(a)',
                                                            },
                                                            {
                                                                value: 'Tutor',
                                                                label: 'Tutor',
                                                            },
                                                            {
                                                                value: 'Otro',
                                                                label: 'Otro',
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                                <Field label="Teléfono">
                                                    <input
                                                        type="tel"
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apoderado_telefono
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apoderado_telefono',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Correo">
                                                    <input
                                                        type="email"
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apoderado_correo
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apoderado_correo',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-5">
                                            <p className="text-sm text-brand-muted">
                                                Adjunta tus documentos en PDF
                                                o imagen (máx. 5 MB cada
                                                uno). Puedes completarlos más
                                                adelante si aún no los
                                                tienes.
                                            </p>
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                {(
                                                    [
                                                        [
                                                            'documento_dni',
                                                            'Copia de DNI',
                                                        ],
                                                        [
                                                            'documento_certificado',
                                                            'Certificado de estudios',
                                                        ],
                                                        [
                                                            'documento_partida',
                                                            'Partida de nacimiento',
                                                        ],
                                                        [
                                                            'documento_foto',
                                                            'Foto tamaño carnet',
                                                        ],
                                                    ] as const
                                                ).map(([field, label]) => (
                                                    <Field
                                                        key={field}
                                                        label={label}
                                                        error={
                                                            errors[field]
                                                        }
                                                    >
                                                        <input
                                                            type="file"
                                                            accept="application/pdf,image/*"
                                                            className="block w-full text-sm text-brand-muted file:mr-4 file:rounded-xl file:border-0 file:bg-brand-hover file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-ink-strong"
                                                            onChange={(e) =>
                                                                setData(
                                                                    field,
                                                                    e.target
                                                                        .files?.[0] ??
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </Field>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-10 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            disabled={step === 0}
                                            className="rounded-xl border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-ink-strong transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Anterior
                                        </button>

                                        {step < steps.length - 1 ? (
                                            <PrimaryButton
                                                key="siguiente"
                                                type="button"
                                                onClick={goNext}
                                            >
                                                Siguiente
                                            </PrimaryButton>
                                        ) : (
                                            <PrimaryButton
                                                key="enviar"
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Enviar solicitud
                                            </PrimaryButton>
                                        )}
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
