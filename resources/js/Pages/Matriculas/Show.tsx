import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Matricula } from '@/types/models';
import MatriculaDetail from './MatriculaDetail';

export default function Show({
    matricula,
    can,
}: {
    matricula: Matricula;
    can: { manage: boolean; registerPayment: boolean };
}) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Matrícula de {matricula.student?.first_name}{' '}
                    {matricula.student?.last_name}
                </h2>
            }
        >
            <Head title="Detalle de matrícula" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <MatriculaDetail matricula={matricula} can={can} />

                    <Link
                        href={route('matriculas.index')}
                        className="text-sm text-brand-muted hover:underline"
                    >
                        Volver a matrículas
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
