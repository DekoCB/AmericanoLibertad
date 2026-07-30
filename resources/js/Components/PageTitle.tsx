import { ReactNode } from 'react';

export default function PageTitle({
    icon,
    children,
    className = '',
}: {
    icon: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <h2
            className={`flex items-center gap-2.5 text-2xl font-bold text-brand-ink-strong ${className}`}
        >
            <span className="text-brand-muted [&>svg]:size-6">{icon}</span>
            {children}
        </h2>
    );
}
