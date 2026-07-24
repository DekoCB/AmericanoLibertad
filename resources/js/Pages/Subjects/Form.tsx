import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Subject } from '@/types/models';

export default function Form({
    subject,
    onSuccess,
    onCancel,
}: {
    subject?: Subject;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: subject?.name ?? '',
        code: subject?.code ?? '',
        description: subject?.description ?? '',
        credit_hours: subject?.credit_hours ?? 4,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (subject) {
            put(route('subjects.update', subject.id), { onSuccess });
        } else {
            post(route('subjects.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value="Nombre" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isFocused
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="code" value="Código" />
                    <TextInput
                        id="code"
                        className="mt-1 block w-full"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                    />
                    <InputError message={errors.code} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="credit_hours"
                        value="Horas crédito"
                    />
                    <TextInput
                        id="credit_hours"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.credit_hours}
                        onChange={(e) =>
                            setData('credit_hours', Number(e.target.value))
                        }
                    />
                    <InputError
                        message={errors.credit_hours}
                        className="mt-2"
                    />
                </div>

                <div className="sm:col-span-2">
                    <InputLabel htmlFor="description" value="Descripción" />
                    <textarea
                        id="description"
                        rows={3}
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.description}
                        onChange={(e) =>
                            setData('description', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.description}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {subject ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
