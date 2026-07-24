import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Carrera, Student } from '@/types/models';
import Form from './Form';

type StudentOption = Pick<
    Student,
    'id' | 'first_name' | 'last_name' | 'carrera_id' | 'ciclo' | 'turno'
>;

export default function Create({
    students,
    carreras,
}: {
    students: StudentOption[];
    carreras: Carrera[];
}) {
    const goToIndex = () => router.visit(route('matriculas.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Nueva matrícula
                </h2>
            }
        >
            <Head title="Nueva matrícula" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <Form
                            students={students}
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
