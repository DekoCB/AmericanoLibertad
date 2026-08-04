import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import QrScanner from '@/Components/QrScanner';
import StudentQrCode from '@/Components/StudentQrCode';
import PageTitle from '@/Components/PageTitle';
import { QrCodeIcon } from '@/Components/Icons';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Asistencia,
    asistenciaEstadoLabels,
    Course,
    Student,
} from '@/types/models';
import { formatDate } from '@/utils/date';

const estadoBadge: Record<Asistencia['estado'], string> = {
    presente: 'bg-green-100 text-green-800',
    tardanza: 'bg-yellow-100 text-yellow-800',
    falta: 'bg-red-100 text-red-800',
    justificado: 'bg-blue-100 text-blue-800',
};

export default function Estudiante({
    student,
    courses,
    mes,
    historial,
}: {
    student: Student;
    courses: Course[];
    mes: string;
    historial: Asistencia[];
}) {
    const [courseId, setCourseId] = useState<string>(
        courses[0] ? String(courses[0].id) : '',
    );
    const [scanning, setScanning] = useState(false);
    const [feedback, setFeedback] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const form = useForm({ course_id: '', codigo: '' });
    const { flash } = usePage<PageProps>().props;

    useEffect(() => {
        if (flash.error) {
            setFeedback({ type: 'error', text: flash.error });
        } else if (flash.success) {
            setFeedback({ type: 'success', text: flash.success });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash.success, flash.error]);

    const changeMes = (nuevoMes: string) => {
        router.get(
            route('asistencias.index'),
            { mes: nuevoMes },
            { preserveState: true },
        );
    };

    const handleScan = (codigo: string) => {
        if (!courseId) return;
        setScanning(false);

        form.transform(() => ({ course_id: courseId, codigo }));
        form.post(route('mis-asistencias.escanear'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<QrCodeIcon />}>Mis asistencias</PageTitle>
            }
        >
            <Head title="Mis asistencias" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            Mi código QR
                        </h3>
                        <p className="mt-1 text-sm text-brand-muted">
                            Muestra este código para que puedan registrar tu
                            asistencia, o úsalo tú mismo escaneándolo abajo.
                        </p>
                        <div className="mt-4 flex justify-center">
                            <StudentQrCode value={student.qr_token} />
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            Marcar mi asistencia
                        </h3>

                        {courses.length === 0 ? (
                            <p className="mt-2 text-sm text-brand-muted">
                                No tienes secciones matriculadas actualmente.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <select
                                    className="block w-full rounded-xl border-brand-border bg-brand-input shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                    value={courseId}
                                    onChange={(e) => {
                                        setCourseId(e.target.value);
                                        setFeedback(null);
                                    }}
                                >
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name} —{' '}
                                            {course.subject?.name}
                                        </option>
                                    ))}
                                </select>

                                {!scanning ? (
                                    <PrimaryButton
                                        type="button"
                                        onClick={() => {
                                            setScanning(true);
                                            setFeedback(null);
                                        }}
                                        disabled={!courseId}
                                    >
                                        Escanear mi código para marcar asistencia
                                    </PrimaryButton>
                                ) : (
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => setScanning(false)}
                                    >
                                        Cancelar
                                    </SecondaryButton>
                                )}

                                <QrScanner
                                    active={scanning}
                                    onScan={handleScan}
                                />

                                {feedback && (
                                    <p
                                        className={`text-sm ${
                                            feedback.type === 'success'
                                                ? 'text-green-700'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {feedback.text}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Mi historial de asistencia
                            </h3>
                            <input
                                type="month"
                                value={mes}
                                onChange={(e) => changeMes(e.target.value)}
                                className="rounded-xl border-brand-border bg-brand-input text-sm shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                            />
                        </div>

                        <div className="mt-4 overflow-hidden overflow-x-auto rounded-lg">
                            <table className="min-w-full divide-y divide-brand-border-faint">
                                <thead className="bg-brand-thead">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                            Fecha
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                            Sección
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border-faint">
                                    {historial.map((asistencia) => (
                                        <tr key={asistencia.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {formatDate(asistencia.fecha)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-brand-ink">
                                                {asistencia.course?.name} —{' '}
                                                {asistencia.course?.subject?.name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${estadoBadge[asistencia.estado]}`}
                                                >
                                                    {
                                                        asistenciaEstadoLabels[
                                                            asistencia.estado
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {historial.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-6 text-center text-sm text-brand-muted"
                                            >
                                                No hay asistencias registradas
                                                este mes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
