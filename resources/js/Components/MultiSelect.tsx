import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@/Components/Icons';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function MultiSelect({
    value,
    onChange,
    options,
    placeholder = 'Seleccionar...',
}: {
    value: string[];
    onChange: (value: string[]) => void;
    options: string[];
    placeholder?: string;
}) {
    return (
        <Listbox value={value} onChange={onChange} multiple>
            <div className="relative mt-1">
                <Listbox.Button className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-input px-3 py-2 text-left shadow-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy">
                    <span className="flex flex-1 flex-wrap gap-1">
                        {value.length === 0 ? (
                            <span className="text-sm text-brand-muted-soft">
                                {placeholder}
                            </span>
                        ) : (
                            value.map((item) => (
                                <span
                                    key={item}
                                    className="flex items-center gap-1 rounded-lg bg-brand-hover px-2.5 py-1 text-sm text-brand-ink"
                                >
                                    {item}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(
                                                value.filter(
                                                    (v) => v !== item,
                                                ),
                                            );
                                        }}
                                        className="text-brand-muted hover:text-red-600"
                                        aria-label={`Quitar ${item}`}
                                    >
                                        <XMarkIcon className="size-3" />
                                    </span>
                                </span>
                            ))
                        )}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 text-brand-muted" />
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-brand-border bg-brand-card py-1 shadow-lg focus:outline-none">
                        {options.length === 0 && (
                            <div className="px-3 py-2 text-sm text-brand-muted">
                                No hay opciones disponibles.
                            </div>
                        )}
                        {options.map((option) => (
                            <Listbox.Option
                                key={option}
                                value={option}
                                className={({ active }) =>
                                    `flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                                        active
                                            ? 'bg-brand-hover text-brand-ink-strong'
                                            : 'text-brand-ink'
                                    }`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span>{option}</span>
                                        {selected && (
                                            <CheckIcon className="size-4 text-brand-navy" />
                                        )}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}
