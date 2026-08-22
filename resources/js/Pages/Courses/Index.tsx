import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import UpcomingEvaluationsCard from '@/Components/UpcomingEvaluationsCard';
import Pagination from '@/Components/Pagination';
import PageTitle from '@/Components/PageTitle';
import { PencilIcon, RectangleStackIcon, TrashIcon } from '@/Components/Icons';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Course, Evaluation, Paginated, PeriodoAcademico, Subject, Teacher } from '@/types/models';
import Form from './Form';

const SIN_MATERIA = 'Sin curso';

export default function Index({
    courses,
    nombresSecciones,
    nombresCarreras,
    filters,
    subjects,
    teachers,
    periodos,
    upcomingEvaluations,
    can,
}: {
    courses: Paginated<Course>;
    nombresSecciones: string[];
    nombresCarreras: string[];
    filters: { name?: string; carrera_name?: string };
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    periodos: Pick<PeriodoAcademico, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin'>[];
    upcomingEvaluations: Evaluation[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [name, setName] = useState(filters.name ?? '');
    const [carreraName, setCarreraName] = useState(
        filters.carrera_name ?? '',
    );
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
            { name: nuevoNombre, carrera_name: carreraName },
            { preserveState: true, replace: true },
        );
    };

    const changeCarrera = (nuevaCarreraName: string) => {
        setCarreraName(nuevaCarreraName);
        router.get(
            route('courses.index'),
            { name, carrera_name: nuevaCarreraName },
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
        courses.data.forEach((course) => {
            const key = course.subject?.name ?? SIN_MATERIA;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(course);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === SIN_MATERIA) return 1;
            if (b === SIN_MATERIA) return -1;
            return a.localeCompare(b);
        });
    }, [courses.data]);

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<RectangleStackIcon />}>Secciones</PageTitle>
            }
        >
            <Head title="Secciones" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                            <div className="w-full max-w-sm">
                                <SearchableSelect
                                    value={carreraName}
                                    onChange={changeCarrera}
                                    placeholder="Buscar por carrera"
                                    allLabel="Todas las carreras"
                                    options={nombresCarreras.map((nombre) => ({
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
                                Nueva sección
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {bySubject.map(([subjectName, subjectCourses]) => (
                            <div
                                key={subjectName}
                                className="rounded-xl bg-brand-card p-6 shadow-sm"
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
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route(
                                                        'courses.show',
                                                        course.id,
                                                    )}
                                                    className="font-medium text-brand-ink hover:text-brand-ink-strong hover:underline"
                                                >
                                                    {course.name}
                                                </Link>
                                                {course.subject?.ciclo && (
                                                    <span className="whitespace-nowrap rounded-lg bg-brand-hover px-2 py-0.5 text-xs font-medium text-brand-muted">
                                                        Ciclo{' '}
                                                        {course.subject.ciclo}
                                                    </span>
                                                )}
                                            </div>
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
                        {courses.data.length === 0 && (
                            <div className="col-span-full rounded-xl bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                No se encontraron secciones.
                            </div>
                        )}
                    </div>

                    <Pagination links={courses.links} />

                    <UpcomingEvaluationsCard
                        evaluations={upcomingEvaluations}
                    />
                </div>
            </div>

            <Modal show={creating} onClose={() => setCreating(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva sección
                    </h2>
                    <Form
                        subjects={subjects}
                        teachers={teachers}
                        periodos={periodos}
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
                        Editar sección
                    </h2>
                    {editingCourse && (
                        <Form
                            course={editingCourse}
                            subjects={subjects}
                            teachers={teachers}
                            periodos={periodos}
                            onSuccess={() => setEditModalOpen(false)}
                            onCancel={() => setEditModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>

            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-card p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-brand-ink-strong">
                            ¿Eliminar sección?
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
