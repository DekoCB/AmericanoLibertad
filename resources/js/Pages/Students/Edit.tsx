import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Carrera, Student } from '@/types/models';
import Form from './Form';

export default function Edit({
    student,
    carreras,
}: {
    student: Student;
    carreras: Carrera[];
}) {
    const goToIndex = () => router.visit(route('students.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Editar estudiante
                </h2>
            }
        >
            <Head title="Editar estudiante" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                        <Form
                            student={student}
                            carreras={carreras}
                            onSuccess={goToIndex}
                            onCancel={goToIndex}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
