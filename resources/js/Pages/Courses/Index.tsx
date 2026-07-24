import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import UpcomingEvaluationsCard from '@/Components/UpcomingEvaluationsCard';
import { PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Course, Evaluation, Subject, Teacher } from '@/types/models';
import Form from './Form';

const SIN_MATERIA = 'Sin materia';

export default function Index({
    courses,
    nombresSecciones,
    nombresMaterias,
    filters,
    subjects,
    teachers,
    upcomingEvaluations,
    can,
}: {
    courses: Course[];
    nombresSecciones: string[];
    nombresMaterias: string[];
    filters: { name?: string; subject_name?: string };
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    upcomingEvaluations: Evaluation[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [name, setName] = useState(filters.name ?? '');
    const [subjectName, setSubjectName] = useState(filters.subject_name ?? '');
    const [creating, setCreating] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<Course | null>(
        null,
    );
    const { delete: destroy, processing } = useForm();

    const changeName = (nuevoNombre: string) => {
        setName(nuevoNombre);
        router.get(
            route('courses.index'),
            { name: nuevoNombre, subject_name: subjectName },
            { preserveState: true, replace: true },
        );
    };

    const changeSubject = (nuevoSubjectName: string) => {
        setSubjectName(nuevoSubjectName);
        router.get(
            route('courses.index'),
            { name, subject_name: nuevoSubjectName },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!confirmingDelete) return;
        destroy(route('courses.destroy', confirmingDelete.id), {
            onSuccess: () => setConfirmingDelete(null),
        });
    };

    const bySubject = useMemo(() => {
        const groups = new Map<string, Course[]>();
        courses.forEach((course) => {
            const key = course.subject?.name ?? SIN_MATERIA;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(course);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === SIN_MATERIA) return 1;
            if (b === SIN_MATERIA) return -1;
            return a.localeCompare(b);
        });
    }, [courses]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Cursos
                </h2>
            }
        >
            <Head title="Cursos" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                            <div className="w-full max-w-sm">
                                <SearchableSelect
                                    value={subjectName}
                                    onChange={changeSubject}
                                    placeholder="Buscar por materia"
                                    allLabel="Todas las materias"
                                    options={nombresMaterias.map((nombre) => ({
                                        value: nombre,
                                        label: nombre,
                                    }))}
                                />
                            </div>
                            <div className="w-full max-w-sm">
                                <SearchableSelect
                                    value={name}
                                    onChange={changeName}
                                    placeholder="Buscar por sección"
                                    allLabel="Todas las secciones"
                                    options={nombresSecciones.map((nombre) => ({
                                        value: nombre,
                                        label: nombre,
                                    }))}
                                />
                            </div>
                        </div>

                        {can.create && (
                            <PrimaryButton onClick={() => setCreating(true)}>
                                Nuevo curso
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {bySubject.map(([subjectName, subjectCourses]) => (
                            <div
                                key={subjectName}
                                className="rounded-[28px] bg-brand-card p-6 shadow-sm"
                            >
                                <h3 className="font-medium text-brand-ink-strong">
                                    {subjectName}
                                </h3>
                                <ul className="mt-3 space-y-1">
                                    {subjectCourses.map((course) => (
                                        <li
                                            key={course.id}
                                            className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-brand-hover"
                                        >
                                            <Link
                                                href={route(
                                                    'courses.show',
                                                    course.id,
                                                )}
                                                className="font-medium text-brand-ink hover:text-brand-ink-strong hover:underline"
                                            >
                                                {course.name}
                                            </Link>
                                            <div className="flex items-center gap-3">
                                                <span className="whitespace-nowrap text-xs text-brand-muted">
                                                    {course.teacher
                                                        ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                                        : 'Sin docente'}{' '}
                                                    · {course.period} ·{' '}
                                                    {course.enrollments_count ??
                                                        0}
                                                    /{course.capacity}
                                                </span>
                                                {can.update && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingCourse(
                                                                course,
                                                            );
                                                            setEditModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="text-brand-link hover:opacity-70"
                                                        title="Editar"
                                                        aria-label="Editar"
                                                    >
                                                        <PencilIcon className="size-4" />
                                                    </button>
                                                )}
                                                {can.delete && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmingDelete(
                                                                course,
                                                            )
                                                        }
                                                        className="text-red-600 hover:opacity-70"
                                                        title="Eliminar"
                                                        aria-label="Eliminar"
                                                    >
                                                        <TrashIcon className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <div className="col-span-full rounded-[28px] bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                No se encontraron cursos.
                            </div>
                        )}
                    </div>

                    <UpcomingEvaluationsCard
                        evaluations={upcomingEvaluations}
                    />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo curso
                    </h2>
                    <Form
                        subjects={subjects}
                        teachers={teachers}
                        onSuccess={() => setCreating(false)}
                        onCancel={() => setCreating(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={editModalOpen}
                onClose={() => setEditModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar curso
                    </h2>
                    {editingCourse && (
                        <Form
                            course={editingCourse}
                            subjects={subjects}
                            teachers={teachers}
                            onSuccess={() => setEditModalOpen(false)}
                            onCancel={() => setEditModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-[20px] border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar curso?
                        </h3>
                        <p className="mt-2 text-sm text-brand-muted">
                            Vas a eliminar {confirmingDelete.name}. Las
                            matrículas, evaluaciones y calificaciones
                            asociadas también se eliminarán.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingDelete(null)}
                                className="rounded-xl px-4 py-2 text-sm text-brand-muted hover:bg-brand-cream"
                            >
                                Cancelar
                            </button>
                            <DangerButton
                                onClick={confirmDelete}
                                disabled={processing}
                            >
                                Eliminar
                            </DangerButton>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
