import Dropdown from '@/Components/Dropdown';
import { BellIcon } from '@/Components/Icons';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function NotificationBell() {
    const { paymentAlert } = usePage<PageProps>().props;

    const pendientes = paymentAlert?.pendientes ?? 0;

    if (!paymentAlert || pendientes === 0) {
        return null;
    }

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="relative inline-flex items-center justify-center rounded-full p-2 text-brand-muted transition hover:bg-brand-hover hover:text-brand-ink-strong"
                    aria-label="Notificaciones"
                >
                    <BellIcon className="size-6" />
                    <span
                        className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: 'var(--stat-icon-amber)' }}
                    >
                        {pendientes}
                    </span>
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="80">
                <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-brand-ink-strong">
                        Notificaciones
                    </p>
                </div>
                <div className="border-t border-brand-border px-4 py-3 text-sm">
                    <p className="text-brand-ink">
                        Tienes {pendientes}{' '}
                        {pendientes === 1
                            ? 'cuota pendiente de pago'
                            : 'cuotas pendientes de pago'}
                        .
                    </p>
                    <Link
                        href={route('mis-pagos.index')}
                        className="mt-1 inline-block font-semibold text-brand-link underline"
                    >
                        Ver mis pagos
                    </Link>
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
