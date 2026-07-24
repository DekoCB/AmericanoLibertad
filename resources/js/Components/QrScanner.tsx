import { Transition } from '@headlessui/react';
import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

export default function QrScanner({
    active,
    onScan,
}: {
    active: boolean;
    onScan: (text: string) => void;
}) {
    const containerId = useRef(
        `qr-reader-${Math.random().toString(36).slice(2)}`,
    ).current;
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!active) return;
        if (!document.getElementById(containerId)) return;

        setError(null);
        let scanner: Html5Qrcode;
        let stopped = false;

        try {
            scanner = new Html5Qrcode(containerId);
        } catch {
            setError('No se pudo iniciar el lector de código QR.');
            return;
        }

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 220 },
                (decodedText) => {
                    if (stopped) return;
                    onScan(decodedText);
                },
                () => {},
            )
            .catch(() => {
                setError(
                    'No se pudo acceder a la cámara. Verifica los permisos del navegador.',
                );
            });

        return () => {
            stopped = true;
            scanner
                .stop()
                .then(() => scanner.clear())
                .catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    return (
        <Transition
            as="div"
            show={active}
            appear
            unmount={false}
            enter="transition-all duration-300 ease-out"
            enterFrom="opacity-0 scale-95 max-h-0 mt-0"
            enterTo="opacity-100 scale-100 max-h-96 mt-4"
            leave="transition-all duration-200 ease-in"
            leaveFrom="opacity-100 scale-100 max-h-96 mt-4"
            leaveTo="opacity-0 scale-95 max-h-0 mt-0"
            className="overflow-hidden"
        >
            <div
                id={containerId}
                className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-brand-border"
            />
            {error && (
                <p className="mt-2 text-center text-sm text-red-600">
                    {error}
                </p>
            )}
        </Transition>
    );
}
