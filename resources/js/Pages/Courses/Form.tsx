import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Course, PeriodoAcademico, Subject, Teacher } from '@/types/models';
import { PageProps } from '@/types';
import PeriodoFechasForm from './PeriodoFechasForm';

const PERIODO_PERSONALIZADO = '__personalizado__';

type PeriodoOption = Pick<
    PeriodoAcademico,
    'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin'
>;

export default function Form({
    course,
    subjects,
    teachers,
    periodos = [],
    onSuccess,
    onCancel,
}: {
    course?: Course;
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    periodos?: PeriodoOption[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { auth } = usePage<PageProps>().props;
    const esDocente = auth.user.role === 'docente';

    const { data, setData, post, put, processing, errors } = useForm({
        subject_id: course?.subject_id ?? subjects[0]?.id ?? '',
        teacher_id: course?.teacher_id ?? '',
        name: course?.name ?? '',
        period: course?.period ?? '',
        periodo_academico_id: course?.periodo_academico_id
            ? String(course.periodo_academico_id)
            : '',
        schedule: course?.schedule ?? '',
        capacity: course?.capacity ?? 30,
    });

    const [periodoPersonalizado, setPeriodoPersonalizado] = useState(
        () =>
            data.periodo_academico_id === '' ||
            !periodos.some((p) => String(p.id) === data.periodo_academico_id),
    );

    const periodoVinculado = periodos.find(
        (p) => String(p.id) === data.periodo_academico_id,
    );

    if (esDocente && course) {
        return (
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-brand-muted">Sección</p>
                    <p className="font-semibold text-brand-ink-strong">
                        {course.name}
                    </p>
                </div>

                {periodoVinculado ? (
                    <PeriodoFechasForm
                        course={course}
                        periodo={periodoVinculado}
                        onDone={onSuccess}
                    />
                ) : (
                    <p className="text-sm text-brand-muted">
                        Esta sección no tiene un período académico vinculado.
                        Solicita a coordinación que lo vincule para poder
                        editar sus fechas.
                    </p>
                )}

                <div className="flex justify-end">
                    <SecondaryButton type="button" onClick={onCancel}>
                        Cerrar
                    </SecondaryButton>
                </div>
            </div>
        );
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (course) {
            put(route('courses.update', course.id), { onSuccess });
        } else {
            post(route('courses.store'), { onSuccess });
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="subject_id" value="Curso" />
                        <div className="mt-1">
                            <SelectMenu
                                id="subject_id"
                                value={String(data.subject_id)}
                                onChange={(value) =>
                                    setData('subject_id', Number(value))
                                }
                                options={subjects.map((subject) => ({
                                    value: String(subject.id),
                                    label: subject.name,
                                }))}
                            />
                        </div>
                        <InputError
                            message={errors.subject_id}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="teacher_id" value="Profesor" />
                        <div className="mt-1">
                            <SelectMenu
                                id="teacher_id"
                                value={String(data.teacher_id)}
                                onChange={(value) =>
                                    setData('teacher_id', value)
                                }
                                options={[
                                    { value: '', label: 'Sin asignar' },
                                    ...teachers.map((teacher) => ({
                                        value: String(teacher.id),
                                        label: `${teacher.first_name} ${teacher.last_name}`,
                                    })),
                                ]}
                            />
                        </div>
                        <InputError
                            message={errors.teacher_id}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="name" value="Nombre" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            placeholder="Sección A"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="periodo_academico_id" value="Período" />
                        <div className="mt-1">
                            <SelectMenu
                                id="periodo_academico_id"
                                value={
                                    periodoPersonalizado
                                        ? PERIODO_PERSONALIZADO
                                        : data.periodo_academico_id
                                }
                                onChange={(value) => {
                                    if (value === PERIODO_PERSONALIZADO) {
                                        setPeriodoPersonalizado(true);
                                        setData('periodo_academico_id', '');
                                        return;
                                    }

                                    setPeriodoPersonalizado(false);
                                    const periodo = periodos.find(
                                        (p) => String(p.id) === value,
                                    );
                                    setData('periodo_academico_id', value);
                                    if (periodo) {
                                        setData('period', periodo.nombre);
                                    }
                                }}
                                options={[
                                    ...periodos.map((periodo) => ({
                                        value: String(periodo.id),
                                        label: periodo.nombre,
                                    })),
                                    {
                                        value: PERIODO_PERSONALIZADO,
                                        label: 'Otro (escribir período)',
                                    },
                                ]}
                            />
                        </div>
                        {periodoPersonalizado && (
                            <TextInput
                                id="period"
                                className="mt-2 block w-full"
                                placeholder="2026-1"
                                value={data.period}
                                onChange={(e) =>
                                    setData('period', e.target.value)
                                }
                            />
                        )}
                        <InputError
                            message={errors.periodo_academico_id}
                            className="mt-2"
                        />
                        <InputError message={errors.period} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="schedule" value="Horario" />
                        <TextInput
                            id="schedule"
                            className="mt-1 block w-full"
                            placeholder="Lun-Mié 08:00-09:30"
                            value={data.schedule}
                            onChange={(e) =>
                                setData('schedule', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.schedule}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="capacity" value="Capacidad" />
                        <TextInput
                            id="capacity"
                            type="number"
                            min={1}
                            max={200}
                            className="mt-1 block w-full"
                            value={data.capacity}
                            onChange={(e) =>
                                setData('capacity', Number(e.target.value))
                            }
                        />
                        <InputError
                            message={errors.capacity}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {course ? 'Guardar cambios' : 'Guardar'}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={onCancel}>
                        Cancelar
                    </SecondaryButton>
                </div>
            </form>

            {course && !periodoPersonalizado && periodoVinculado && (
                <PeriodoFechasForm
                    course={course}
                    periodo={periodoVinculado}
                />
            )}
        </div>
    );
}
