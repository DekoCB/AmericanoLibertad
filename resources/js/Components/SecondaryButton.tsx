import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-xl border border-brand-border bg-brand-card px-4 py-2 text-xs font-semibold uppercase tracking-widest text-brand-ink shadow-sm transition duration-150 ease-in-out hover:bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
