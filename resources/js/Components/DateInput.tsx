import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@/Components/Icons';
import { formatDate, parseDisplayDate, parseIsoToDate } from '@/utils/date';
import { Popover, Transition } from '@headlessui/react';
import { Fragment, RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function toIso(year: number, month: number, day: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
    if (Number.isNaN(year) || Number.isNaN(month)) {
        const today = new Date();
        year = today.getFullYear();
        month = today.getMonth();
    }

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    for (let i = firstWeekday; i > 0; i--) {
        cells.push({ date: new Date(year, month, 1 - i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last);
        next.setDate(next.getDate() + 1);
        cells.push({ date: next, inMonth: false });
    }

    return cells;
}

function CalendarPortal({
    anchorRef,
    open,
    viewDate,
    setViewDate,
    value,
    min,
    max,
    todayIso,
    onSelect,
}: {
    anchorRef: RefObject<HTMLDivElement>;
    open: boolean;
    viewDate: { year: number; month: number };
    setViewDate: (updater: (v: { year: number; month: number }) => { year: number; month: number }) => void;
    value: string;
    min?: string;
    max?: string;
    todayIso: string;
    onSelect: (date: Date, close: () => void) => void;
}) {
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!open) return;

        const updatePos = () => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (rect) setPos({ top: rect.bottom + 4, left: rect.left });
        };

        updatePos();
        window.addEventListener('resize', updatePos);
        window.addEventListener('scroll', updatePos, true);
        return () => {
            window.removeEventListener('resize', updatePos);
            window.removeEventListener('scroll', updatePos, true);
        };
    }, [anchorRef, open]);

    const grid = buildMonthGrid(viewDate.year, viewDate.month);

    return createPortal(
        <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <Popover.Panel
                static
                className="fixed z-50 w-64 rounded-xl border border-brand-border bg-brand-card p-3 shadow-lg"
                style={{ top: pos.top, left: pos.left }}
            >
                {({ close }) => (
                    <>
                        <div className="mb-2 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewDate((v) =>
                                        v.month === 0
                                            ? { year: v.year - 1, month: 11 }
                                            : { year: v.year, month: v.month - 1 },
                                    )
                                }
                                className="rounded p-1 text-brand-muted hover:bg-brand-hover hover:text-brand-ink"
                            >
                                <ChevronLeftIcon className="size-4" />
                            </button>
                            <span className="text-sm font-medium capitalize text-brand-ink-strong">
                                {MESES[viewDate.month]} {viewDate.year}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setViewDate((v) =>
                                        v.month === 11
                                            ? { year: v.year + 1, month: 0 }
                                            : { year: v.year, month: v.month + 1 },
                                    )
                                }
                                className="rounded p-1 text-brand-muted hover:bg-brand-hover hover:text-brand-ink"
                            >
                                <ChevronRightIcon className="size-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-muted">
                            {DIAS.map((d) => (
                                <div key={d}>{d}</div>
                            ))}
                        </div>
                        <div className="mt-1 grid grid-cols-7 gap-1">
                            {grid.map(({ date, inMonth }, i) => {
                                const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
                                const isSelected = value === iso;
                                const isToday = iso === todayIso;
                                const disabled = (!!min && iso < min) || (!!max && iso > max);

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => onSelect(date, close)}
                                        className={[
                                            'rounded-md py-1 text-xs',
                                            inMonth ? 'text-brand-ink' : 'text-brand-muted/40',
                                            isSelected
                                                ? 'bg-brand-navy text-white'
                                                : 'hover:bg-brand-hover',
                                            isToday && !isSelected ? 'ring-1 ring-brand-navy' : '',
                                            disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : '',
                                        ].join(' ')}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </Popover.Panel>
        </Transition>,
        document.body,
    );
}

export default function DateInput({
    id,
    value,
    onChange,
    className = '',
    required,
    min,
    max,
    placeholder = 'dd/mm/aaaa',
}: {
    id?: string;
    value: string;
    onChange: (iso: string) => void;
    className?: string;
    required?: boolean;
    min?: string;
    max?: string;
    placeholder?: string;
}) {
    const [text, setText] = useState(() => formatDate(value));
    const [viewDate, setViewDate] = useState(() => {
        const base = parseIsoToDate(value) ?? new Date();
        return { year: base.getFullYear(), month: base.getMonth() };
    });
    const anchorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setText(formatDate(value));
        const base = parseIsoToDate(value);
        if (base) {
            setViewDate({ year: base.getFullYear(), month: base.getMonth() });
        }
    }, [value]);

    const handleTextChange = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length > 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        } else if (digits.length > 2) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        setText(formatted);

        if (digits.length === 8) {
            onChange(parseDisplayDate(formatted) ?? '');
        } else if (digits.length === 0) {
            onChange('');
        }
    };

    const selectDay = (date: Date, close: () => void) => {
        const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
        onChange(iso);
        setText(formatDate(iso));
        close();
    };

    const todayIso = toIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <div ref={anchorRef} className="relative">
                        <input
                            id={id}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={placeholder}
                            required={required}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className={
                                'rounded-xl border-brand-border bg-brand-input pr-9 text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy ' +
                                className
                            }
                        />
                        <Popover.Button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-2 text-brand-muted hover:text-brand-ink"
                            aria-label="Abrir calendario"
                        >
                            <CalendarDaysIcon className="size-4" />
                        </Popover.Button>
                    </div>

                    <CalendarPortal
                        anchorRef={anchorRef}
                        open={open}
                        viewDate={viewDate}
                        setViewDate={setViewDate}
                        value={value}
                        min={min}
                        max={max}
                        todayIso={todayIso}
                        onSelect={selectDay}
                    />
                </>
            )}
        </Popover>
    );
}
