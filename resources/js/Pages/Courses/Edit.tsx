import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Course, PeriodoAcademico, Subject, Teacher } from '@/types/models';
import Form from './Form';

export default function Edit({
    course,
    subjects,
    teachers,
    periodos,
}: {
    course: Course;
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
    periodos: Pick<PeriodoAcademico, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin'>[];
}) {
    const goToIndex = () => router.visit(route('courses.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Editar sección
                </h2>
            }
        >
            <Head title="Editar sección" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                        <Form
                            course={course}
                            subjects={subjects}
                            teachers={teachers}
                            periodos={periodos}
                            onSuccess={goToIndex}
                            onCancel={goToIndex}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
