import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Course, Subject, Teacher } from '@/types/models';
import Form from './Form';

export default function Edit({
    course,
    subjects,
    teachers,
}: {
    course: Course;
    subjects: Pick<Subject, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[];
}) {
    const goToIndex = () => router.visit(route('courses.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Editar curso
                </h2>
            }
        >
            <Head title="Editar curso" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <Form
                            course={course}
                            subjects={subjects}
                            teachers={teachers}
                            onSuccess={goToIndex}
                            onCancel={goToIndex}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
