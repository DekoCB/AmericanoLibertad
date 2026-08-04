import { CheckIcon, ChevronDownIcon } from '@/Components/Icons';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function SelectMenu({
    id,
    value,
    onChange,
    options,
    placeholder = 'Selecciona...',
    className = '',
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
}) {
    const selectedLabel = options.find((option) => option.value === value)?.label;

    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative">
                <Listbox.Button
                    id={id}
                    className={
                        'relative w-full cursor-pointer rounded-xl border border-brand-border bg-brand-input py-2 pl-3 pr-9 text-left text-sm text-brand-ink shadow-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy ' +
                        className
                    }
                >
                    <span className={selectedLabel ? '' : 'text-brand-muted'}>
                        {selectedLabel ?? placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        <ChevronDownIcon className="size-4 text-brand-muted" />
                    </span>
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-brand-border bg-brand-card py-1 shadow-lg focus:outline-none">
                        {options.map((option) => (
                            <Listbox.Option
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
                                        <span
                                            className={
                                                selected
                                                    ? 'font-semibold text-brand-ink-strong'
                                                    : ''
                                            }
                                        >
                                            {option.label}
                                        </span>
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
