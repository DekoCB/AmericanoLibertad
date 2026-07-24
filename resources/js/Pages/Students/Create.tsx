import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Carrera } from '@/types/models';
import Form from './Form';

export default function Create({ carreras }: { carreras: Carrera[] }) {
    const goToIndex = () => router.visit(route('students.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Nuevo estudiante
                </h2>
            }
        >
            <Head title="Nuevo estudiante" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <Form
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
