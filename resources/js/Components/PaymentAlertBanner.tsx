import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ExclamationTriangleIcon } from '@/Components/Icons';
import { formatDate } from '@/utils/date';

export default function PaymentAlertBanner() {
    const { paymentAlert } = usePage<PageProps>().props;

    if (!paymentAlert || paymentAlert.efectivoPorConfirmar.length === 0) {
        return null;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-2 px-4 pt-6 sm:px-6 lg:px-8">
            {paymentAlert.efectivoPorConfirmar.map((pago) => {
                const vencido = pago.fecha_limite_pago
                    ? pago.fecha_limite_pago <=
                      new Date().toISOString().slice(0, 10)
                    : false;

                const color = vencido
                    ? 'var(--money-out)'
                    : 'var(--stat-icon-amber)';

                return (
                    <div
                        key={pago.id}
                        className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
                        style={{
                            backgroundColor: 'transparent',
                            borderColor: color,
                            color,
                        }}
                    >
                        <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            Declaraste un pago en efectivo de S/{' '}
                            {pago.monto.toFixed(2)} — preséntate a pagar en
                            la institución antes del{' '}
                            {pago.fecha_limite_pago
                                ? formatDate(pago.fecha_limite_pago)
                                : '—'}{' '}
                            o no podrá confirmarse.
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
