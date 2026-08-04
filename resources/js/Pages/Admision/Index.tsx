import ApplicationLogo from '@/Components/ApplicationLogo';
import PrimaryButton from '@/Components/PrimaryButton';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import { CheckIcon } from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    cloneElement,
    FormEventHandler,
    isValidElement,
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

            <div className="min-h-screen bg-brand-cream text-brand-ink">
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

                <div className="mx-auto max-w-4xl px-6 py-12">
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
                                                    <input
                                                        type="date"
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.fecha_nacimiento
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'fecha_nacimiento',
                                                                e.target
                                                                    .value,
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
                                                    <select
                                                        required
                                                        className={
                                                            inputClass
                                                        }
                                                        value={data.turno}
                                                        onChange={(e) =>
                                                            setData(
                                                                'turno',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        <option value="mañana">
                                                            Mañana
                                                        </option>
                                                        <option value="tarde">
                                                            Tarde
                                                        </option>
                                                        <option value="noche">
                                                            Noche
                                                        </option>
                                                    </select>
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
                                                    <select
                                                        className={
                                                            inputClass
                                                        }
                                                        value={
                                                            data.apoderado_parentesco
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'apoderado_parentesco',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Selecciona
                                                        </option>
                                                        <option value="Padre">
                                                            Padre
                                                        </option>
                                                        <option value="Madre">
                                                            Madre
                                                        </option>
                                                        <option value="Hermano(a)">
                                                            Hermano(a)
                                                        </option>
                                                        <option value="Tutor">
                                                            Tutor
                                                        </option>
                                                        <option value="Otro">
                                                            Otro
                                                        </option>
                                                    </select>
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
