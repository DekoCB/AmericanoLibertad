import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Cuota, medioPagoLabels } from '@/types/models';

export default function PagoForm({
    cuota,
    onDone,
}: {
    cuota: Pick<Cuota, 'id' | 'monto_programado' | 'monto_pagado'>;
    onDone: () => void;
}) {
    const saldo = cuota.monto_programado - cuota.monto_pagado;
    const { data, setData, post, processing, errors, reset } = useForm({
        monto: saldo.toFixed(2),
        medio: 'efectivo',
        monto_efectivo: saldo.toFixed(2),
        monto_yape: '0',
        fecha: new Date().toISOString().slice(0, 10),
        nota: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('cuotas.pagos.store', cuota.id), {
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="monto" value="Monto a pagar" />
                    <TextInput
                        id="monto"
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={saldo}
                        className="mt-1 block w-full"
                        value={data.monto}
                        onChange={(e) => setData('monto', e.target.value)}
                    />
                    <InputError message={errors.monto} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="medio" value="Modalidad de pago" />
                    <div className="mt-1">
                        <SelectMenu
                            id="medio"
                            value={data.medio}
                            onChange={(value) => setData('medio', value)}
                            options={[
                                { value: 'efectivo', label: medioPagoLabels.efectivo },
                                { value: 'yape', label: medioPagoLabels.yape },
                                { value: 'plin', label: medioPagoLabels.plin },
                                { value: 'tarjeta', label: medioPagoLabels.tarjeta },
                            ]}
                        />
                    </div>
                    <InputError message={errors.medio} className="mt-1" />
                </div>

                {data.medio === 'efectivo' && (
                    <div>
                        <InputLabel
                            htmlFor="monto_efectivo"
                            value="Monto en efectivo"
                        />
                        <TextInput
                            id="monto_efectivo"
                            type="number"
                            step="0.01"
                            min={0}
                            className="mt-1 block w-full"
                            value={data.monto_efectivo}
                            onChange={(e) =>
                                setData('monto_efectivo', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.monto_efectivo}
                            className="mt-1"
                        />
                    </div>
                )}

                {data.medio === 'yape' && (
                    <div>
                        <InputLabel htmlFor="monto_yape" value="Monto en Yape" />
                        <TextInput
                            id="monto_yape"
                            type="number"
                            step="0.01"
                            min={0}
                            className="mt-1 block w-full"
                            value={data.monto_yape}
                            onChange={(e) =>
                                setData('monto_yape', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.monto_yape}
                            className="mt-1"
                        />
                    </div>
                )}

                <div>
                    <InputLabel htmlFor="fecha" value="Fecha de pago" />
                    <DateInput
                        id="fecha"
                        className="mt-1 block w-full"
                        value={data.fecha}
                        onChange={(v) => setData('fecha', v)}
                    />
                    <InputError message={errors.fecha} className="mt-1" />
                </div>

                <div className="sm:col-span-2">
                    <InputLabel htmlFor="nota" value="Nota (opcional)" />
                    <TextInput
                        id="nota"
                        className="mt-1 block w-full"
                        value={data.nota}
                        onChange={(e) => setData('nota', e.target.value)}
                    />
                    <InputError message={errors.nota} className="mt-1" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Registrar pago
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
