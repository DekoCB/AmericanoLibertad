import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Carrera } from '@/types/models';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateCode = () =>
    Array.from(
        { length: 3 },
        () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
    ).join('');

export default function Form({
    carrera,
    onSuccess,
    onCancel,
}: {
    carrera?: Carrera;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: carrera?.name ?? '',
        code: carrera?.code ?? generateCode(),
        total_ciclos: carrera?.total_ciclos ?? 6,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (carrera) {
            put(route('carreras.update', carrera.id), { onSuccess });
        } else {
            post(route('carreras.store'), {
                onSuccess: () => {
                    onSuccess();
                    setData('code', generateCode());
                },
            });
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
                        placeholder="Enfermería"
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
                        placeholder="ENF"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                    />
                    <InputError message={errors.code} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="total_ciclos" value="Total de ciclos" />
                    <TextInput
                        id="total_ciclos"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.total_ciclos}
                        onChange={(e) =>
                            setData('total_ciclos', Number(e.target.value))
                        }
                    />
                    <InputError
                        message={errors.total_ciclos}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {carrera ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
