import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTitle from '@/Components/PageTitle';
import SecondaryButton from '@/Components/SecondaryButton';
import { ArrowUpTrayIcon, UsersIcon } from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { Carrera } from '@/types/models';

type ImportSummary = {
    studentsCreated: number;
    studentsReused: number;
    enrollmentsCreated: number;
    enrollmentsExisting: number;
    warnings: string[];
};

export default function Import({
    carreras,
    summary,
}: {
    carreras: Pick<Carrera, 'id' | 'name' | 'code'>[];
    summary?: ImportSummary;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setData, post, processing, reset } = useForm<{
        file: File | null;
    }>({ file: null });

    const abrirSelector = () => fileInputRef.current?.click();

    const subirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;
        if (!archivo) return;

        setData('file', archivo);
        post(route('students.import.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
            onFinish: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <PageTitle icon={<ArrowUpTrayIcon />}>
                        Importar estudiantes
                    </PageTitle>
                    <Link
                        href={route('students.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a estudiantes
                    </Link>
                </div>
            }
        >
            <Head title="Importar estudiantes" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-hover text-brand-navy">
                                <UsersIcon className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-ink-strong">
                                    Formato del Excel
                                </h3>
                                <p className="mt-1 text-sm text-brand-muted">
                                    El archivo debe tener una hoja para cada
                                    sección: una cuyo nombre empiece con{' '}
                                    <strong>L-V</strong> (Lunes a Viernes) y
                                    otra con <strong>S-D</strong> (Sábado a
                                    Domingo). En cada hoja, cualquier bloque
                                    de columnas con encabezados{' '}
                                    <strong>Alumnos</strong>,{' '}
                                    <strong>Ciclo</strong> y{' '}
                                    <strong>Carrera</strong> (en ese orden) se
                                    lee automáticamente — puede haber más de
                                    un bloque por hoja, uno al lado del otro.
                                </p>
                                <p className="mt-2 text-sm text-brand-muted">
                                    El ciclo va en número romano (I–X) y la
                                    carrera como texto libre (se reconoce por
                                    coincidencia con el nombre registrado,
                                    p. ej. "ENFERMERIA" coincide con "
                                    {carreras[0]?.name ?? 'Enfermería Técnica'}
                                    "). Cada alumno queda matriculado en todos
                                    los cursos de su carrera y ciclo, en la
                                    sección (LV o SD) de la hoja donde
                                    aparece. Si el nombre y la carrera ya
                                    existen, se reutiliza el registro en vez
                                    de duplicarlo.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3 border-t border-brand-border-faint pt-6">
                            <SecondaryButton
                                type="button"
                                onClick={abrirSelector}
                                disabled={processing}
                                className="inline-flex items-center gap-2"
                            >
                                <ArrowUpTrayIcon className="size-4" />
                                {processing
                                    ? 'Procesando...'
                                    : 'Seleccionar archivo Excel'}
                            </SecondaryButton>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={subirArchivo}
                            />
                        </div>
                    </div>

                    {summary && (
                        <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                            <h3 className="font-bold text-brand-ink-strong">
                                Resultado de la importación
                            </h3>

                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl bg-brand-hover px-4 py-3 text-center">
                                    <div className="text-2xl font-bold text-brand-ink-strong">
                                        {summary.studentsCreated}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        Alumnos nuevos
                                    </div>
                                </div>
                                <div className="rounded-xl bg-brand-hover px-4 py-3 text-center">
                                    <div className="text-2xl font-bold text-brand-ink-strong">
                                        {summary.studentsReused}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        Ya existían
                                    </div>
                                </div>
                                <div className="rounded-xl bg-brand-hover px-4 py-3 text-center">
                                    <div className="text-2xl font-bold text-brand-ink-strong">
                                        {summary.enrollmentsCreated}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        Matrículas nuevas
                                    </div>
                                </div>
                                <div className="rounded-xl bg-brand-hover px-4 py-3 text-center">
                                    <div className="text-2xl font-bold text-brand-ink-strong">
                                        {summary.enrollmentsExisting}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        Ya matriculados
                                    </div>
                                </div>
                            </div>

                            {summary.warnings.length > 0 && (
                                <div className="mt-5">
                                    <h4 className="text-sm font-semibold text-amber-700">
                                        Advertencias (
                                        {summary.warnings.length})
                                    </h4>
                                    <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                        {summary.warnings.map((w, i) => (
                                            <li key={i}>• {w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
