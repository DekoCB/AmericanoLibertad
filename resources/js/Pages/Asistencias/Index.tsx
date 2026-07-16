import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
    AsistenciaSheetRow,
    Course,
    asistenciaEstadoLabels,
} from '@/types/models';

const estadoBadge: Record<string, string> = {
    presente:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    tardanza:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    falta: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    justificado:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    sin_registro:
        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function Index({
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
    const inputRef = useRef<HTMLInputElement>(null);

    const scanForm = useForm({ document_number: '', fecha });
    const manualForm = useForm({ student_id: '', fecha, estado: 'presente' });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const changeFecha = (nuevaFecha: string) => {
        router.get(
            route('courses.asistencias.index', course.id),
            { fecha: nuevaFecha },
            { preserveState: true },
        );
    };

    const submitScan = (e: FormEvent) => {
        e.preventDefault();
        scanForm.setData('document_number', dniInput);
        scanForm.post(route('courses.asistencias.escanear', course.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setFeedback(`DNI ${dniInput} registrado.`);
                setDniInput('');
                inputRef.current?.focus();
            },
            onError: () => {
                setFeedback(`No se encontró un matriculado con DNI ${dniInput}.`);
                setDniInput('');
                inputRef.current?.focus();
            },
        });
    };

    const marcarEstado = (studentId: number, estado: string) => {
        manualForm.transform(() => ({ student_id: studentId, fecha, estado }));
        manualForm.post(route('courses.asistencias.store', course.id), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Asistencia — {course.name} ({course.subject?.name})
                    </h2>
                    <Link
                        href={route('courses.show', course.id)}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                    >
                        Volver al curso
                    </Link>
                </div>
            }
        >
            <Head title="Tomar asistencia" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-3">
                            <InputLabel htmlFor="fecha" value="Fecha" />
                            <TextInput
                                id="fecha"
                                type="date"
                                value={fecha}
                                onChange={(e) => changeFecha(e.target.value)}
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
                        </form>
                        {feedback && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {feedback}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            Un lector de código de barras/QR funciona igual que un
                            teclado: escanea el carnet del estudiante y el DNI se
                            escribe automáticamente en el campo.
                        </p>
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        DNI
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {sheet.map((row) => (
                                    <tr key={row.student.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {row.student.first_name} {row.student.last_name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {row.student.document_number}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    row.asistencia
                                                        ? estadoBadge[row.asistencia.estado]
                                                        : estadoBadge.sin_registro
                                                }`}
                                            >
                                                {row.asistencia
                                                    ? asistenciaEstadoLabels[row.asistencia.estado]
                                                    : 'Sin registro'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <select
                                                className="rounded-md border-gray-300 text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                value={row.asistencia?.estado ?? ''}
                                                onChange={(e) =>
                                                    marcarEstado(
                                                        row.student.id,
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="" disabled>
                                                    Marcar...
                                                </option>
                                                {Object.entries(asistenciaEstadoLabels).map(
                                                    ([value, label]) => (
                                                        <option key={value} value={value}>
                                                            {label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {sheet.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Este curso no tiene estudiantes matriculados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
