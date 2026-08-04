import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateInput from '@/Components/DateInput';
import InputLabel from '@/Components/InputLabel';
import Pagination from '@/Components/Pagination';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    Asistencia,
    asistenciaEstadoLabels,
    Carrera,
    Course,
    Paginated,
    Student,
} from '@/types/models';

const estadoBadge: Record<Asistencia['estado'], string> = {
    presente: 'bg-green-100 text-green-800',
    tardanza: 'bg-yellow-100 text-yellow-800',
    falta: 'bg-red-100 text-red-800',
    justificado: 'bg-blue-100 text-blue-800',
};

const SIN_CARRERA = 'Sin carrera';

type Filters = {
    fecha: string;
    carrera_id: string;
    course_id: string;
    student_id: string;
};

export default function Historial({
    asistencias,
    carreras,
    courses,
    students,
    filters,
}: {
    asistencias: Paginated<Asistencia>;
    carreras: Pick<Carrera, 'id' | 'name'>[];
    courses: Pick<Course, 'id' | 'name' | 'subject_id' | 'subject'>[];
    students: Pick<Student, 'id' | 'first_name' | 'last_name'>[];
    filters: Partial<Filters>;
}) {
    const current: Filters = {
        fecha: filters.fecha ?? '',
        carrera_id: filters.carrera_id ?? '',
        course_id: filters.course_id ?? '',
        student_id: filters.student_id ?? '',
    };

    const updateFilter = (key: keyof Filters, value: string) => {
        router.get(
            route('asistencias.historial'),
            { ...current, [key]: value },
            { preserveState: true, replace: true },
        );
    };

    const porCarrera = useMemo(() => {
        const carreraGroups = new Map<string, Asistencia[]>();
        asistencias.data.forEach((asistencia) => {
            const key = asistencia.student?.carrera?.name ?? SIN_CARRERA;
            if (!carreraGroups.has(key)) carreraGroups.set(key, []);
            carreraGroups.get(key)!.push(asistencia);
        });

        return Array.from(carreraGroups.entries())
            .sort(([a], [b]) => {
                if (a === SIN_CARRERA) return 1;
                if (b === SIN_CARRERA) return -1;
                return a.localeCompare(b);
            })
            .map(([carreraName, registros]) => ({
                carreraName,
                registros,
            }));
    }, [asistencias]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        Historial de asistencias
                    </h2>
                    <Link
                        href={route('asistencias.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a asistencias
                    </Link>
                </div>
            }
        >
            <Head title="Historial de asistencias" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <InputLabel htmlFor="fecha" value="Fecha" />
                                <DateInput
                                    id="fecha"
                                    className="mt-1"
                                    value={current.fecha}
                                    onChange={(v) => updateFilter('fecha', v)}
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="carrera_id"
                                    value="Carrera"
                                />
                                <div className="mt-1 w-56">
                                    <SearchableSelect
                                        value={current.carrera_id}
                                        onChange={(value) =>
                                            updateFilter('carrera_id', value)
                                        }
                                        placeholder="Buscar carrera..."
                                        allLabel="Todas"
                                        options={carreras.map((carrera) => ({
                                            value: String(carrera.id),
                                            label: carrera.name,
                                        }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="course_id"
                                    value="Sección"
                                />
                                <div className="mt-1 w-56">
                                    <SearchableSelect
                                        value={current.course_id}
                                        onChange={(value) =>
                                            updateFilter('course_id', value)
                                        }
                                        placeholder="Buscar sección..."
                                        options={courses.map((course) => ({
                                            value: String(course.id),
                                            label: `${course.name} — ${course.subject?.name}${course.subject?.ciclo ? ` (Ciclo ${course.subject.ciclo})` : ''}`,
                                        }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="student_id"
                                    value="Alumno"
                                />
                                <div className="mt-1 w-56">
                                    <SearchableSelect
                                        value={current.student_id}
                                        onChange={(value) =>
                                            updateFilter('student_id', value)
                                        }
                                        placeholder="Buscar alumno..."
                                        options={students.map((student) => ({
                                            value: String(student.id),
                                            label: `${student.first_name} ${student.last_name}`,
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-brand-muted">
                            {asistencias.total} registros encontrados
                        </p>
                    </div>

                    {porCarrera.map(({ carreraName, registros }) => (
                        <details
                            key={carreraName}
                            open
                            className="rounded-[20px] border border-brand-border bg-brand-card p-6"
                        >
                            <summary className="flex cursor-pointer list-none items-center gap-3">
                                <h3 className="text-lg font-bold text-brand-ink-strong">
                                    {carreraName}
                                </h3>
                                <span className="rounded-full bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                    {registros.length}
                                </span>
                            </summary>

                            <div className="mt-4 overflow-hidden overflow-x-auto rounded-lg border border-brand-border-faint">
                                <table className="min-w-full divide-y divide-brand-border-faint">
                                    <thead className="bg-brand-thead">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Estudiante
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Sección
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                                Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border-faint">
                                        {registros.map((registro) => (
                                            <tr key={registro.id}>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-brand-ink-strong">
                                                    {registro.student?.first_name}{' '}
                                                    {registro.student?.last_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm text-brand-ink">
                                                    {registro.course?.name} —{' '}
                                                    {registro.course?.subject?.name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm">
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-medium ${estadoBadge[registro.estado]}`}
                                                    >
                                                        {
                                                            asistenciaEstadoLabels[
                                                                registro.estado
                                                            ]
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    ))}

                    {asistencias.data.length === 0 && (
                        <div className="rounded-[20px] border border-brand-border bg-brand-card px-4 py-6 text-center text-sm text-brand-muted">
                            No se encontraron asistencias en la fecha
                            seleccionada.
                        </div>
                    )}

                    <Pagination links={asistencias.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
