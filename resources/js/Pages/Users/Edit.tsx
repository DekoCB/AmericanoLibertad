import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { User, UserRole } from '@/types';
import Form from './Form';

interface PersonOption {
    id: number;
    first_name: string;
    last_name: string;
}

export default function Edit({
    user,
    roles,
    teachers,
    students,
}: {
    user: User;
    roles: UserRole[];
    teachers: PersonOption[];
    students: PersonOption[];
}) {
    const goToIndex = () => router.visit(route('users.index'));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Editar usuario
                </h2>
            }
        >
            <Head title="Editar usuario" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="border border-brand-border bg-brand-card p-6 sm:rounded-lg">
                        <Form
                            user={user}
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
