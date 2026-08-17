import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PeriodoAcademico } from '@/types/models';

export default function Form({
    periodo,
    onSuccess,
    onCancel,
}: {
    periodo?: PeriodoAcademico;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        nombre: periodo?.nombre ?? '',
        fecha_inicio: periodo?.fecha_inicio.slice(0, 10) ?? '',
        fecha_fin: periodo?.fecha_fin.slice(0, 10) ?? '',
        activo: periodo?.activo ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (periodo) {
            put(route('periodos-academicos.update', periodo.id), {
                onSuccess,
            });
        } else {
            post(route('periodos-academicos.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="nombre" value="Nombre del período" />
                    <TextInput
                        id="nombre"
                        className="mt-1 block w-full"
                        placeholder="2026-2"
                        value={data.nombre}
                        onChange={(e) => setData('nombre', e.target.value)}
                        isFocused
                    />
                    <InputError message={errors.nombre} className="mt-2" />
                </div>

                <div className="flex items-end gap-2 pb-2">
                    <input
                        id="activo"
                        type="checkbox"
                        checked={data.activo}
                        onChange={(e) =>
                            setData('activo', e.target.checked)
                        }
                        className="rounded border-brand-border text-brand-navy focus:ring-brand-navy"
                    />
                    <InputLabel htmlFor="activo" value="Período activo" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="fecha_inicio"
                        value="Fecha de inicio"
                    />
                    <DateInput
                        id="fecha_inicio"
                        className="mt-1 block w-full"
                        value={data.fecha_inicio}
                        onChange={(v) => setData('fecha_inicio', v)}
                    />
                    <InputError
                        message={errors.fecha_inicio}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="fecha_fin" value="Fecha de fin" />
                    <DateInput
                        id="fecha_fin"
                        className="mt-1 block w-full"
                        value={data.fecha_fin}
                        onChange={(v) => setData('fecha_fin', v)}
                    />
                    <InputError
                        message={errors.fecha_fin}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {periodo ? 'Guardar cambios' : 'Crear período'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
