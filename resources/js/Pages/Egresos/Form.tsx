import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function Form({
    onSuccess,
    onCancel,
}: {
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        concepto: '',
        categoria: 'operativo',
        monto: '',
        fecha: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('egresos.store'), { onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="concepto" value="Concepto" />
                    <TextInput
                        id="concepto"
                        className="mt-1 block w-full"
                        placeholder="Pago de servicios, planilla docente, etc."
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
                    <select
                        id="categoria"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.categoria}
                        onChange={(e) =>
                            setData('categoria', e.target.value)
                        }
                    >
                        <option value="pago_docente">Pago a docente</option>
                        <option value="operativo">Operativo</option>
                        <option value="otro">Otro</option>
                    </select>
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
                    Registrar egreso
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
