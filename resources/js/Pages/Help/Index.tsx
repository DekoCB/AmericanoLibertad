import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import HelpContent from './HelpContent';

export default function Index() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Ayuda
                </h2>
            }
        >
            <Head title="Ayuda" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-brand-border bg-brand-card p-6">
                        <HelpContent />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
