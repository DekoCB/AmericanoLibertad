import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { UserRole } from '@/types';
import Form from './Form';

interface PersonOption {
    id: number;
    first_name: string;
    last_name: string;
}

export default function Create({
    roles,
    teachers,
    students,
}: {
    roles: UserRole[];
    teachers: PersonOption[];
    students: PersonOption[];
}) {
    const goToIndex = () => router.visit(route('users.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Nuevo usuario
                </h2>
            }
        >
            <Head title="Nuevo usuario" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-[20px]">
                        <Form
                            roles={roles}
                            teachers={teachers}
                            students={students}
                            onSuccess={goToIndex}
                            onCancel={goToIndex}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
