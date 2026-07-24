import { CheckIcon, ChevronDownIcon } from '@/Components/Icons';
import { Combobox, Transition } from '@headlessui/react';
import { Fragment, useMemo, useState } from 'react';

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Buscar...',
    allLabel = 'Todos',
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; searchText?: string }[];
    placeholder?: string;
    allLabel?: string;
}) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(
        () =>
            query === ''
                ? options
                : options.filter((option) =>
                      (option.searchText ?? option.label)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                  ),
        [options, query],
    );

    const selectedLabel =
        options.find((option) => option.value === value)?.label ?? '';

    return (
        <Combobox
            value={value}
            onChange={(newValue) => onChange(newValue ?? '')}
        >
            <div className="relative">
                <div className="relative">
                    <Combobox.Input
                        className="block w-full rounded-xl border-brand-border bg-brand-input text-sm shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        displayValue={() => selectedLabel}
                        placeholder={placeholder}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                        <ChevronDownIcon className="size-4 text-brand-muted" />
                    </Combobox.Button>
                </div>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery('')}
                >
                    <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-brand-border bg-brand-card py-1 shadow-lg focus:outline-none">
                        <Combobox.Option
                            value=""
                            className={({ active }) =>
                                `flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                                    active
                                        ? 'bg-brand-hover text-brand-ink-strong'
                                        : 'text-brand-ink'
                                }`
                            }
                        >
                            {allLabel}
                        </Combobox.Option>
                        {filtered.map((option) => (
                            <Combobox.Option
                                key={option.value}
                                value={option.value}
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
                                        <span>{option.label}</span>
                                        {selected && (
                                            <CheckIcon className="size-4 text-brand-navy" />
                                        )}
                                    </>
                                )}
                            </Combobox.Option>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-sm text-brand-muted">
                                Sin resultados.
                            </div>
                        )}
                    </Combobox.Options>
                </Transition>
            </div>
        </Combobox>
    );
}
