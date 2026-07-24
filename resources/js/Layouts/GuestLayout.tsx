import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeToggleButton from '@/Components/ThemeToggleButton';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="bg-page-pattern animate-drift-pattern flex min-h-screen flex-col items-center bg-brand-cream px-4 pt-6 sm:justify-center sm:pt-0">
            <div className="flex w-full max-w-md items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <ApplicationLogo className="size-12 rounded-xl object-contain" />
                    <span className="text-lg font-semibold text-brand-ink-strong">
                        Instituto Americano Libertad
                    </span>
                </Link>
                <ThemeToggleButton />
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-[20px] border border-brand-border bg-brand-card px-6 py-6 shadow-sm sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
