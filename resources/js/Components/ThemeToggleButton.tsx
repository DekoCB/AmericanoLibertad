import { MoonIcon, SunIcon } from '@/Components/Icons';
import { useTheme } from '@/theme';

export default function ThemeToggleButton({
    className = '',
}: {
    className?: string;
}) {
    const { theme, setTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-card text-brand-muted transition hover:bg-brand-hover hover:text-brand-ink-strong ${className}`}
        >
            {theme === 'dark' ? (
                <SunIcon className="size-5" />
            ) : (
                <MoonIcon className="size-5" />
            )}
        </button>
    );
}
