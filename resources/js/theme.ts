import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function getStoredTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);

    // Chromium/WebKit only repaint custom-styled scrollbars on a layout
    // change, not on a plain class/CSS-variable update, so force a reflow
    // to make the new scrollbar colors show up immediately.
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    void html.offsetHeight;
    html.style.overflow = previousOverflow;
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return { theme, setTheme };
}
