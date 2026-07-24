export function formatDate(value: string | null | undefined): string {
    if (!value) return '';

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return '';

    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseIsoToDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;

    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
}

export function parseDisplayDate(display: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
}
