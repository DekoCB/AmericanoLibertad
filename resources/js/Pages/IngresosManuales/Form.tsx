import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { ingresoManualCategoriaLabels } from '@/types/models';

export default function Form({
    onSuccess,
    onCancel,
}: {
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        concepto: '',
        categoria: 'otro',
        monto: '',
        fecha: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('ingresos-manuales.store'), { onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="concepto" value="Concepto" />
                    <TextInput
                        id="concepto"
                        className="mt-1 block w-full"
                        placeholder="Donación, alquiler de auditorio, etc."
                        value={data.concepto}
                        onChange={(e) =>
                            setData('concepto', e.target.value)
                        }
                        isFocused
                    />
                    <InputError message={errors.concepto} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="categoria" value="Categoría" />
                    <div className="mt-1">
                        <SelectMenu
                            id="categoria"
                            value={data.categoria}
                            onChange={(value) =>
                                setData('categoria', value)
                            }
                            options={Object.entries(
                                ingresoManualCategoriaLabels,
                            ).map(([value, label]) => ({ value, label }))}
                        />
                    </div>
                    <InputError
                        message={errors.categoria}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="monto" value="Monto" />
                    <TextInput
                        id="monto"
                        type="number"
                        step="0.01"
                        min={0.01}
                        className="mt-1 block w-full"
                        value={data.monto}
                        onChange={(e) => setData('monto', e.target.value)}
                    />
                    <InputError message={errors.monto} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="fecha" value="Fecha" />
                    <DateInput
                        id="fecha"
                        className="mt-1 block w-full"
                        value={data.fecha}
                        onChange={(v) => setData('fecha', v)}
                    />
                    <InputError message={errors.fecha} className="mt-2" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    Registrar ingreso
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
