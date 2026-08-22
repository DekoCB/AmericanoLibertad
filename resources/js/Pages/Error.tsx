import { ExclamationTriangleIcon } from '@/Components/Icons';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const MESSAGES: Record<number, { title: string; description: string }> = {
    403: {
        title: 'No tienes acceso a esta sección',
        description:
            'Tu rol no cuenta con permisos para ver esta página. Si crees que es un error, contacta a un administrador.',
    },
    404: {
        title: 'Página no encontrada',
        description: 'La página que buscas no existe o fue movida.',
    },
    419: {
        title: 'La sesión expiró',
        description: 'Tu sesión caducó por inactividad. Vuelve a iniciar sesión para continuar.',
    },
    429: {
        title: 'Demasiadas solicitudes',
        description: 'Has realizado demasiados intentos. Espera un momento y vuelve a intentarlo.',
    },
    500: {
        title: 'Algo salió mal',
        description: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo en unos minutos.',
    },
    503: {
        title: 'Servicio no disponible',
        description: 'El sistema está en mantenimiento. Vuelve a intentarlo en unos minutos.',
    },
};

export default function Error({ status }: { status: number }) {
    const { auth } = usePage<PageProps>().props;
    const isAuthenticated = Boolean(auth?.user);
    const { title, description } = MESSAGES[status] ?? {
        title: 'Ocurrió un error',
        description: 'No pudimos completar tu solicitud.',
    };

    return (
        <GuestLayout>
            <Head title={title} />

            <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div
                    className="flex size-16 items-center justify-center rounded-lg"
                    style={{
                        background: 'oklch(92% 0.05 55)',
                        color: 'oklch(48% 0.14 55)',
                    }}
                >
                    <ExclamationTriangleIcon className="size-8" />
                </div>

                <div
                    className="text-sm font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--brand-muted)' }}
                >
                    Error {status}
                </div>

                <h1 className="text-xl font-bold text-brand-ink-strong">
                    {title}
                </h1>

                <p className="text-sm text-brand-muted">{description}</p>

                <Link
                    href={isAuthenticated ? route('dashboard') : route('login')}
                    className="mt-2"
                >
                    <PrimaryButton>
                        {isAuthenticated ? 'Volver al dashboard' : 'Iniciar sesión'}
                    </PrimaryButton>
                </Link>
            </div>
        </GuestLayout>
    );
}
