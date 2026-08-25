import DateInput from '@/Components/DateInput';
import InputLabel from '@/Components/InputLabel';
import QrScanner from '@/Components/QrScanner';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
    Asistencia,
    AsistenciaSheetRow,
    Course,
    asistenciaEstadoLabels,
} from '@/types/models';
import { formatDate } from '@/utils/date';

const estadoBadge: Record<string, string> = {
    presente: 'bg-green-100 text-green-800',
    tardanza: 'bg-yellow-100 text-yellow-800',
    falta: 'bg-red-100 text-red-800',
    justificado: 'bg-blue-100 text-blue-800',
    sin_registro: 'bg-brand-hover text-brand-muted',
};

function TomarAsistencia({
    course,
    fecha,
    sheet,
}: {
    course: Course;
    fecha: string;
    sheet: AsistenciaSheetRow[];
}) {
    const [dniInput, setDniInput] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const scanForm = useForm({ document_number: '', fecha });
    const manualForm = useForm({ student_id: '', fecha, estado: 'presente' });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const changeFecha = (nuevaFecha: string) => {
        router.get(
            route('aula-virtual.show', course.id),
            { tab: 'asistencia', fecha: nuevaFecha },
            { preserveState: true, preserveScroll: true },
        );
    };

    const submitCodigo = (codigo: string) => {
        scanForm.setData('document_number', codigo);
        scanForm.post(route('courses.asistencias.escanear', course.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setFeedback(`Código ${codigo} registrado.`);
                setDniInput('');
                inputRef.current?.focus();
            },
            onError: () => {
                setFeedback(
                    `No se encontró un matriculado con el código ${codigo}.`,
                );
                setDniInput('');
                inputRef.current?.focus();
            },
        });
    };

    const submitScan = (e: FormEvent) => {
        e.preventDefault();
        submitCodigo(dniInput);
    };

    const handleCameraScan = (codigo: string) => {
        setCameraActive(false);
        submitCodigo(codigo);
    };

    const marcarEstado = (studentId: number, estado: string) => {
        manualForm.transform(() => ({ student_id: studentId, fecha, estado }));
        manualForm.post(route('courses.asistencias.store', course.id), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                <div className="mb-4 flex items-center gap-3">
                    <InputLabel htmlFor="fecha" value="Fecha" />
                    <DateInput
                        id="fecha"
                        value={fecha}
                        onChange={(v) => changeFecha(v)}
                    />
                </div>

                <form onSubmit={submitScan} className="flex gap-2">
                    <TextInput
                        ref={inputRef}
                        autoFocus
                        autoComplete="off"
                        placeholder="Escanea el código QR o digita el DNI y presiona Enter"
                        className="flex-1"
                        value={dniInput}
                        onChange={(e) => setDniInput(e.target.value)}
                    />
                    <PrimaryButton
                        type="submit"
                        disabled={scanForm.processing || dniInput === ''}
                    >
                        Registrar
                    </PrimaryButton>
                    <SecondaryButton
                        type="button"
                        onClick={() => setCameraActive((v) => !v)}
                    >
                        {cameraActive ? 'Cerrar cámara' : 'Usar cámara'}
                    </SecondaryButton>
                </form>

                <QrScanner active={cameraActive} onScan={handleCameraScan} />

                {feedback && (
                    <p className="mt-2 text-sm text-brand-muted">
                        {feedback}
                    </p>
                )}
                <p className="mt-1 text-xs text-brand-muted-soft">
                    Un lector de código de barras/QR funciona igual que un
                    teclado: escanea el carnet del estudiante y el DNI se
                    escribe automáticamente en el campo.
                </p>
            </div>

            <div className="overflow-hidden overflow-x-auto rounded-lg bg-brand-card shadow-sm">
                <table className="min-w-full divide-y divide-brand-border-faint">
                    <thead className="bg-brand-thead">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                Estudiante
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                DNI
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                Estado
                            </th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-faint">
                        {sheet.map((row) => (
                            <tr key={row.student.id}>
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-ink-strong">
                                    {row.student.first_name}{' '}
                                    {row.student.last_name}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                    {row.student.document_number}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm">
                                    <span
                                        className={`rounded-lg px-2 py-1 text-xs font-medium ${
                                            row.asistencia
                                                ? estadoBadge[
                                                      row.asistencia.estado
                                                  ]
                                                : estadoBadge.sin_registro
                                        }`}
                                    >
                                        {row.asistencia
                                            ? asistenciaEstadoLabels[
                                                  row.asistencia.estado
                                              ]
                                            : 'Sin registro'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                    <div className="ml-auto w-36">
                                        <SelectMenu
                                            value={row.asistencia?.estado ?? ''}
                                            onChange={(value) =>
                                                marcarEstado(
                                                    row.student.id,
                                                    value,
                                                )
                                            }
                                            placeholder="Marcar..."
                                            options={Object.entries(
                                                asistenciaEstadoLabels,
                                            ).map(([value, label]) => ({
                                                value,
                                                label,
                                            }))}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sheet.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-sm text-brand-muted"
                                >
                                    Esta sección no tiene estudiantes
                                    matriculados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MiAsistencia({ misAsistencias }: { misAsistencias: Asistencia[] }) {
    return (
        <div className="overflow-hidden overflow-x-auto rounded-lg bg-brand-card shadow-sm">
            <table className="min-w-full divide-y divide-brand-border-faint">
                <thead className="bg-brand-thead">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                            Estado
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-faint">
                    {misAsistencias.map((asistencia) => (
                        <tr key={asistencia.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                {formatDate(asistencia.fecha)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                <span
                                    className={`rounded-lg px-2 py-1 text-xs font-medium ${estadoBadge[asistencia.estado]}`}
                                >
                                    {asistenciaEstadoLabels[asistencia.estado]}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {misAsistencias.length === 0 && (
                        <tr>
                            <td
                                colSpan={2}
                                className="px-4 py-6 text-center text-sm text-brand-muted"
                            >
                                Todavía no hay registros de asistencia para
                                este curso.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function AsistenciaPanel({
    course,
    fecha,
    sheet,
    misAsistencias,
    canManage,
}: {
    course: Course;
    fecha: string;
    sheet: AsistenciaSheetRow[] | null;
    misAsistencias: Asistencia[] | null;
    canManage: boolean;
}) {
    if (canManage && sheet) {
        return <TomarAsistencia course={course} fecha={fecha} sheet={sheet} />;
    }

    if (misAsistencias) {
        return <MiAsistencia misAsistencias={misAsistencias} />;
    }

    return null;
}
