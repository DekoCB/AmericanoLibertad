import { EyeIcon, EyeSlashIcon } from '@/Components/Icons';
import TextInput from '@/Components/TextInput';
import { forwardRef, InputHTMLAttributes, useState } from 'react';

export default forwardRef<
    { focus: () => void },
    Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
        isFocused?: boolean;
    }
>(function PasswordInput({ className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <TextInput
                {...props}
                ref={ref}
                type={visible ? 'text' : 'password'}
                className={`pr-10 ${className}`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                aria-label={
                    visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted transition hover:text-brand-navy"
            >
                {visible ? (
                    <EyeSlashIcon className="size-5" />
                ) : (
                    <EyeIcon className="size-5" />
                )}
            </button>
        </div>
    );
});
