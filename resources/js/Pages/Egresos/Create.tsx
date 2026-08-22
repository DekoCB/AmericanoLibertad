import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Form from './Form';

export default function Create() {
    const goToIndex = () => router.visit(route('egresos.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Nuevo egreso
                </h2>
            }
        >
            <Head title="Nuevo egreso" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                        <Form onSuccess={goToIndex} onCancel={goToIndex} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
