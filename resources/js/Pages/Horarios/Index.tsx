import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Carrera,
    Course,
    diaSemanaLabels,
    turnoLabels,
} from '@/types/models';

function HorarioForm({ course, onDone }: { course: Course; onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        dia_semana: 'lunes',
        hora_inicio: '08:00',
        hora_fin: '09:30',
        aula: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('courses.horarios.store', course.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
        >
            <div>
                <InputLabel htmlFor={`dia-${course.id}`} value="Día" />
                <select
                    id={`dia-${course.id}`}
                    className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    value={data.dia_semana}
                    onChange={(e) => setData('dia_semana', e.target.value)}
                >
                    {Object.entries(diaSemanaLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <InputLabel htmlFor={`inicio-${course.id}`} value="Inicio" />
                <TextInput
                    id={`inicio-${course.id}`}
                    type="time"
                    className="mt-1 block"
                    value={data.hora_inicio}
                    onChange={(e) => setData('hora_inicio', e.target.value)}
                />
            </div>
            <div>
                <InputLabel htmlFor={`fin-${course.id}`} value="Fin" />
                <TextInput
                    id={`fin-${course.id}`}
                    type="time"
                    className="mt-1 block"
                    value={data.hora_fin}
                    onChange={(e) => setData('hora_fin', e.target.value)}
                />
            </div>
            <div>
                <InputLabel htmlFor={`aula-${course.id}`} value="Aula" />
                <TextInput
                    id={`aula-${course.id}`}
                    className="mt-1 block"
                    placeholder="Aula 101"
                    value={data.aula}
                    onChange={(e) => setData('aula', e.target.value)}
                />
            </div>
            <PrimaryButton disabled={processing}>Agregar</PrimaryButton>
            <SecondaryButton type="button" onClick={onDone}>
                Cancelar
            </SecondaryButton>
            {(errors.hora_inicio || errors.hora_fin) && (
                <p className="w-full text-sm text-red-600 dark:text-red-400">
                    {errors.hora_inicio ?? errors.hora_fin}
                </p>
            )}
        </form>
    );
}

export default function Index({
    courses,
    carreras,
    filters,
    can,
}: {
    courses: Course[];
    carreras: Carrera[];
    filters: { carrera_id?: string; ciclo?: string; turno?: string };
    can: { manage: boolean };
}) {
    const [carreraId, setCarreraId] = useState(filters.carrera_id ?? '');
    const [ciclo, setCiclo] = useState(filters.ciclo ?? '');
    const [turno, setTurno] = useState(filters.turno ?? '');
    const [addingTo, setAddingTo] = useState<number | null>(null);
    const { delete: destroy } = useForm();

    const applyFilters = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('horarios.index'),
            { carrera_id: carreraId, ciclo, turno },
            { preserveState: true },
        );
    };

    const deleteHorario = (courseId: number, horarioId: number) => {
        if (!confirm('¿Eliminar este horario?')) return;
        destroy(route('courses.horarios.destroy', [courseId, horarioId]), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Horarios
                </h2>
            }
        >
            <Head title="Horarios" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={applyFilters}
                        className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
                    >
                        <div>
                            <InputLabel htmlFor="carrera_id" value="Carrera" />
                            <select
                                id="carrera_id"
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={carreraId}
                                onChange={(e) => setCarreraId(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {carreras.map((carrera) => (
                                    <option key={carrera.id} value={carrera.id}>
                                        {carrera.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="ciclo" value="Ciclo" />
                            <TextInput
                                id="ciclo"
                                type="number"
                                min={1}
                                max={20}
                                className="mt-1 block w-24"
                                value={ciclo}
                                onChange={(e) => setCiclo(e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="turno" value="Turno" />
                            <select
                                id="turno"
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={turno}
                                onChange={(e) => setTurno(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {Object.entries(turnoLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <PrimaryButton type="submit">Filtrar</PrimaryButton>
                    </form>

                    <div className="space-y-4">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {course.name} — {course.subject?.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {course.subject?.carrera?.name ?? 'Sin carrera'}
                                            {course.subject?.ciclo ? ` · Ciclo ${course.subject.ciclo}` : ''}
                                            {course.turno ? ` · ${turnoLabels[course.turno]}` : ''}
                                            {course.teacher
                                                ? ` · ${course.teacher.first_name} ${course.teacher.last_name}`
                                                : ' · Sin docente'}
                                        </p>
                                    </div>
                                    {can.manage && addingTo !== course.id && (
                                        <SecondaryButton
                                            onClick={() => setAddingTo(course.id)}
                                        >
                                            Agregar horario
                                        </SecondaryButton>
                                    )}
                                </div>

                                {addingTo === course.id && (
                                    <HorarioForm
                                        course={course}
                                        onDone={() => setAddingTo(null)}
                                    />
                                )}

                                <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                                    {(course.horarios ?? []).map((horario) => (
                                        <li
                                            key={horario.id}
                                            className="flex items-center justify-between py-2 text-sm"
                                        >
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {diaSemanaLabels[horario.dia_semana]} ·{' '}
                                                {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                                                {horario.aula ? ` · ${horario.aula}` : ''}
                                            </span>
                                            {can.manage && (
                                                <button
                                                    onClick={() =>
                                                        deleteHorario(course.id, horario.id)
                                                    }
                                                    className="text-red-600 hover:underline dark:text-red-400"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                    {(course.horarios ?? []).length === 0 && (
                                        <li className="py-2 text-sm text-gray-500 dark:text-gray-400">
                                            Sin horarios asignados.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        ))}

                        {courses.length === 0 && (
                            <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
                                No se encontraron cursos con esos filtros.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
