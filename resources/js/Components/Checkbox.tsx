import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-brand-border bg-brand-card text-brand-navy shadow-sm focus:ring-brand-navy ' +
                className
            }
        />
    );
}
