import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, Subject, Teacher } from '@/types/models';

export default function Form({
    course,
    subjects,
    teachers,
    onSuccess,
    onCancel,
}: {
    course?: Course;
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        subject_id: course?.subject_id ?? subjects[0]?.id ?? '',
        teacher_id: course?.teacher_id ?? '',
        name: course?.name ?? '',
        period: course?.period ?? '',
        schedule: course?.schedule ?? '',
        capacity: course?.capacity ?? 30,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (course) {
            put(route('courses.update', course.id), { onSuccess });
        } else {
            post(route('courses.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="subject_id" value="Curso" />
                    <select
                        id="subject_id"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.subject_id}
                        onChange={(e) =>
                            setData('subject_id', Number(e.target.value))
                        }
                    >
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.subject_id}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="teacher_id" value="Profesor" />
                    <select
                        id="teacher_id"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.teacher_id}
                        onChange={(e) =>
                            setData('teacher_id', e.target.value)
                        }
                    >
                        <option value="">Sin asignar</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                            </option>
                        ))}
                    </select>
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
                    <InputLabel htmlFor="period" value="Período" />
                    <TextInput
                        id="period"
                        className="mt-1 block w-full"
                        placeholder="2026-1"
                        value={data.period}
                        onChange={(e) => setData('period', e.target.value)}
                    />
                    <InputError message={errors.period} className="mt-2" />
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
                    <InputError message={errors.schedule} className="mt-2" />
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
                    <InputError message={errors.capacity} className="mt-2" />
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
    );
}
