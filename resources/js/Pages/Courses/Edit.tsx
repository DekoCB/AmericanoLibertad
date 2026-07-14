import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, Subject, Teacher } from '@/types/models';

export default function Edit({
    course,
    subjects,
    teachers,
}: {
    course: Course;
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        subject_id: course.subject_id,
        teacher_id: course.teacher_id ?? '',
        name: course.name,
        period: course.period,
        schedule: course.schedule ?? '',
        capacity: course.capacity,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('courses.update', course.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editar curso
                </h2>
            }
        >
            <Head title="Editar curso" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="subject_id"
                                        value="Materia"
                                    />
                                    <select
                                        id="subject_id"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.subject_id}
                                        onChange={(e) =>
                                            setData(
                                                'subject_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        {subjects.map((subject) => (
                                            <option
                                                key={subject.id}
                                                value={subject.id}
                                            >
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
                                    <InputLabel
                                        htmlFor="teacher_id"
                                        value="Profesor"
                                    />
                                    <select
                                        id="teacher_id"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        value={data.teacher_id}
                                        onChange={(e) =>
                                            setData(
                                                'teacher_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Sin asignar</option>
                                        {teachers.map((teacher) => (
                                            <option
                                                key={teacher.id}
                                                value={teacher.id}
                                            >
                                                {teacher.first_name}{' '}
                                                {teacher.last_name}
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
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="period"
                                        value="Período"
                                    />
                                    <TextInput
                                        id="period"
                                        className="mt-1 block w-full"
                                        value={data.period}
                                        onChange={(e) =>
                                            setData('period', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.period}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="schedule"
                                        value="Horario"
                                    />
                                    <TextInput
                                        id="schedule"
                                        className="mt-1 block w-full"
                                        value={data.schedule}
                                        onChange={(e) =>
                                            setData(
                                                'schedule',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.schedule}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="capacity"
                                        value="Capacidad"
                                    />
                                    <TextInput
                                        id="capacity"
                                        type="number"
                                        min={1}
                                        max={200}
                                        className="mt-1 block w-full"
                                        value={data.capacity}
                                        onChange={(e) =>
                                            setData(
                                                'capacity',
                                                Number(e.target.value),
                                            )
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
                                    Guardar cambios
                                </PrimaryButton>
                                <Link
                                    href={route('courses.index')}
                                    className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                                >
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
