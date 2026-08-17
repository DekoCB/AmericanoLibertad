import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CalificarModal from '@/Components/CalificarModal';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SelectMenu from '@/Components/SelectMenu';
import { PencilIcon, TrashIcon } from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Aula,
    Course,
    diaSemanaLabels,
    Enrollment,
    enrollmentStatusLabels,
    Evaluation,
    evaluationTypeLabels,
    Horario,
    PeriodoAcademico,
    Student,
    Subject,
    Teacher,
} from '@/types/models';
import { formatDate } from '@/utils/date';
import CourseForm from './Form';
import EvaluationForm from '../Evaluations/Form';
import SlotForm from '../Horarios/SlotForm';

interface CourseShowPermissions {
    manageEnrollments: boolean;
    manageCourse: boolean;
    deleteCourse: boolean;
    manageEvaluations: boolean;
    grade: boolean;
    manageHorarios: boolean;
}

export default function Show({
    course,
    enrollments,
    evaluations,
    availableStudents,
    subjects,
    teachers,
    aulas,
    periodos,
    can,
}: {
    course: Course;
    enrollments: Enrollment[];
    evaluations: Evaluation[];
    availableStudents: Pick<Student, 'id' | 'first_name' | 'last_name'>[];
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    aulas: Aula[];
    periodos: Pick<PeriodoAcademico, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin'>[];
    can: CourseShowPermissions;
}) {
    const enrollForm = useForm({ student_id: availableStudents[0]?.id ?? '' });
    const [editingCourse, setEditingCourse] = useState(false);
    const [creatingEvaluation, setCreatingEvaluation] = useState(false);
    const [editingEvaluation, setEditingEvaluation] =
        useState<Evaluation | null>(null);
    const [editEvaluationModalOpen, setEditEvaluationModalOpen] =
        useState(false);
    const [addingHorario, setAddingHorario] = useState(false);
    const [editingHorario, setEditingHorario] = useState<Horario | null>(
        null,
    );

    const submitEnroll = (e: FormEvent) => {
        e.preventDefault();
        enrollForm.post(route('courses.enrollments.store', course.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-brand-ink-strong">
                        {course.name} — {course.subject?.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                        {can.manageCourse && (
                            <Link
                                href={route('courses.asistencias.index', course.id)}
                                className="text-brand-link hover:underline"
                            >
                                Tomar asistencia
                            </Link>
                        )}
                        {can.manageCourse && (
                            <button
                                type="button"
                                onClick={() => setEditingCourse(true)}
                                className="text-brand-link hover:opacity-70"
                                title="Editar sección"
                                aria-label="Editar sección"
                            >
                                <PencilIcon className="size-4" />
                            </button>
                        )}
                        <Link
                            href={route('courses.index')}
                            className="text-brand-muted hover:underline"
                        >
                            Volver a secciones
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={course.name} />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 rounded-[20px] bg-brand-card p-6 shadow-sm sm:grid-cols-4">
                        <div>
                            <div className="text-xs uppercase text-brand-muted">
                                Profesor
                            </div>
                            <div className="text-brand-ink-strong">
                                {course.teacher
                                    ? `${course.teacher.first_name} ${course.teacher.last_name}`
                                    : 'Sin asignar'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-brand-muted">
                                Período
                            </div>
                            <div className="text-brand-ink-strong">
                                {course.period}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-brand-muted">
                                Horario
                            </div>
                            <div className="text-brand-ink-strong">
                                {course.schedule ?? '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-brand-muted">
                                Cupos
                            </div>
                            <div className="text-brand-ink-strong">
                                {enrollments.length} / {course.capacity}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-brand-ink-strong">
                                    Estudiantes matriculados
                                </h3>
                            </div>

                            {can.manageEnrollments && availableStudents.length > 0 && (
                                <form
                                    onSubmit={submitEnroll}
                                    className="mb-4 flex gap-2"
                                >
                                    <div className="flex-1">
                                        <SelectMenu
                                            value={String(
                                                enrollForm.data.student_id,
                                            )}
                                            onChange={(value) =>
                                                enrollForm.setData(
                                                    'student_id',
                                                    Number(value),
                                                )
                                            }
                                            options={availableStudents.map(
                                                (student) => ({
                                                    value: String(student.id),
                                                    label: `${student.first_name} ${student.last_name}`,
                                                }),
                                            )}
                                        />
                                    </div>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={enrollForm.processing}
                                    >
                                        Matricular
                                    </PrimaryButton>
                                </form>
                            )}

                            <ul className="divide-y divide-brand-border-faint">
                                {enrollments.map((enrollment) => (
                                    <li
                                        key={enrollment.id}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div>
                                            <div className="text-sm text-brand-ink-strong">
                                                {enrollment.student?.first_name}{' '}
                                                {enrollment.student?.last_name}
                                            </div>
                                            <div className="text-xs text-brand-muted">
                                                {
                                                    enrollmentStatusLabels[
                                                        enrollment.status
                                                    ]
                                                }
                                            </div>
                                        </div>
                                        {can.manageEnrollments && (
                                            <Link
                                                as="button"
                                                method="delete"
                                                href={route(
                                                    'courses.enrollments.destroy',
                                                    [course.id, enrollment.id],
                                                )}
                                                onBefore={() =>
                                                    confirm(
                                                        '¿Quitar esta matrícula de la sección?',
                                                    )
                                                }
                                                preserveScroll
                                                className="text-sm text-red-600 hover:underline"
                                            >
                                                Quitar
                                            </Link>
                                        )}
                                    </li>
                                ))}
                                {enrollments.length === 0 && (
                                    <li className="py-4 text-sm text-brand-muted">
                                        Aún no hay estudiantes matriculados.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-brand-ink-strong">
                                    Evaluaciones
                                </h3>
                                {can.manageEvaluations && (
                                    <PrimaryButton
                                        onClick={() =>
                                            setCreatingEvaluation(true)
                                        }
                                    >
                                        Nueva evaluación
                                    </PrimaryButton>
                                )}
                            </div>

                            <ul className="divide-y divide-brand-border-faint">
                                {evaluations.map((evaluation) => (
                                    <li
                                        key={evaluation.id}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div>
                                            <div className="text-sm text-brand-ink-strong">
                                                {evaluation.name}
                                            </div>
                                            <div className="text-xs text-brand-muted">
                                                {
                                                    evaluationTypeLabels[
                                                        evaluation.type
                                                    ]
                                                }{' '}
                                                · {formatDate(evaluation.date)} ·{' '}
                                                {evaluation.weight}% ·{' '}
                                                {evaluation.grades_count ?? 0}{' '}
                                                notas registradas
                                            </div>
                                        </div>
                                        {(can.grade ||
                                            can.manageEvaluations) && (
                                            <div className="flex items-center gap-3 text-sm">
                                                {can.grade && (
                                                    <CalificarModal
                                                        evaluationId={
                                                            evaluation.id
                                                        }
                                                    >
                                                        {(open) => (
                                                            <button
                                                                type="button"
                                                                onClick={open}
                                                                className="text-brand-link hover:underline"
                                                            >
                                                                Calificar
                                                            </button>
                                                        )}
                                                    </CalificarModal>
                                                )}
                                                {can.manageEvaluations && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingEvaluation(
                                                                evaluation,
                                                            );
                                                            setEditEvaluationModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="text-brand-muted hover:opacity-70"
                                                        title="Editar"
                                                        aria-label="Editar"
                                                    >
                                                        <PencilIcon className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {evaluations.length === 0 && (
                                    <li className="py-4 text-sm text-brand-muted">
                                        Aún no hay evaluaciones para esta
                                        sección.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-brand-ink-strong">
                                Horario de clases
                            </h3>
                            {can.manageHorarios && (
                                <PrimaryButton
                                    onClick={() => setAddingHorario(true)}
                                >
                                    Nuevo horario
                                </PrimaryButton>
                            )}
                        </div>

                        <ul className="divide-y divide-brand-border-faint">
                            {(course.horarios ?? []).map((horario) => (
                                <li
                                    key={horario.id}
                                    className="flex items-center justify-between py-2"
                                >
                                    <div className="text-sm text-brand-ink-strong">
                                        {diaSemanaLabels[horario.dia_semana]}{' '}
                                        <span className="text-brand-muted">
                                            {horario.hora_inicio.slice(0, 5)}–
                                            {horario.hora_fin.slice(0, 5)}
                                        </span>{' '}
                                        · {horario.aula_ref?.nombre ?? horario.aula ?? 'Sin aula'}
                                    </div>
                                    {can.manageHorarios && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingHorario(horario)
                                                }
                                                className="text-brand-muted hover:opacity-70"
                                                title="Editar"
                                                aria-label="Editar"
                                            >
                                                <PencilIcon className="size-4" />
                                            </button>
                                            <Link
                                                as="button"
                                                method="delete"
                                                href={route(
                                                    'courses.horarios.destroy',
                                                    [course.id, horario.id],
                                                )}
                                                onBefore={() =>
                                                    confirm(
                                                        '¿Eliminar este horario?',
                                                    )
                                                }
                                                preserveScroll
                                                className="text-red-600 hover:opacity-70"
                                                title="Eliminar"
                                                aria-label="Eliminar"
                                            >
                                                <TrashIcon className="size-4" />
                                            </Link>
                                        </div>
                                    )}
                                </li>
                            ))}
                            {(course.horarios ?? []).length === 0 && (
                                <li className="py-4 text-sm text-brand-muted">
                                    Aún no hay horarios registrados para esta
                                    sección.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <Modal show={editingCourse} onClose={() => setEditingCourse(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar sección
                    </h2>
                    <CourseForm
                        course={course}
                        subjects={subjects}
                        teachers={teachers}
                        periodos={periodos}
                        onSuccess={() => setEditingCourse(false)}
                        onCancel={() => setEditingCourse(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={creatingEvaluation}
                onClose={() => setCreatingEvaluation(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva evaluación
                    </h2>
                    <EvaluationForm
                        course={course}
                        onSuccess={() => setCreatingEvaluation(false)}
                        onCancel={() => setCreatingEvaluation(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={editEvaluationModalOpen}
                onClose={() => setEditEvaluationModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar evaluación
                    </h2>
                    {editingEvaluation && (
                        <EvaluationForm
                            course={course}
                            evaluation={editingEvaluation}
                            onSuccess={() => setEditEvaluationModalOpen(false)}
                            onCancel={() => setEditEvaluationModalOpen(false)}
                        />
                    )}
                </div>
            </Modal>

            <Modal show={addingHorario} onClose={() => setAddingHorario(false)}>
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nuevo horario
                    </h2>
                    <SlotForm
                        course={course}
                        aulas={aulas}
                        onSuccess={() => setAddingHorario(false)}
                        onCancel={() => setAddingHorario(false)}
                    />
                </div>
            </Modal>

            <Modal
                show={editingHorario !== null}
                onClose={() => setEditingHorario(null)}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Editar horario
                    </h2>
                    {editingHorario && (
                        <SlotForm
                            course={course}
                            horario={editingHorario}
                            aulas={aulas}
                            onSuccess={() => setEditingHorario(null)}
                            onCancel={() => setEditingHorario(null)}
                        />
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
