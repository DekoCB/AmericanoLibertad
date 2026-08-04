import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { Carrera, Subject } from '@/types/models';

export default function Form({
    subject,
    carreras,
    onSuccess,
    onCancel,
}: {
    subject?: Subject;
    carreras: Pick<Carrera, 'id' | 'name' | 'code' | 'total_ciclos'>[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: subject?.name ?? '',
        code: subject?.code ?? '',
        description: subject?.description ?? '',
        credit_hours: subject?.credit_hours ?? 4,
        carrera_id: subject?.carrera_id ? String(subject.carrera_id) : '',
        ciclo: subject?.ciclo ? String(subject.ciclo) : '',
    });

    const carreraSeleccionada = carreras.find(
        (carrera) => String(carrera.id) === data.carrera_id,
    );

    const ciclosDisponibles = useMemo(() => {
        const total = carreraSeleccionada?.total_ciclos ?? 12;
        return Array.from({ length: total }, (_, i) => i + 1);
    }, [carreraSeleccionada]);

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
                    <InputLabel htmlFor="carrera_id" value="Carrera" />
                    <div className="mt-1">
                        <SelectMenu
                            id="carrera_id"
                            value={data.carrera_id}
                            onChange={(value) => {
                                setData('carrera_id', value);
                                setData('ciclo', '');
                            }}
                            placeholder="Selecciona una carrera"
                            options={carreras.map((carrera) => ({
                                value: String(carrera.id),
                                label: carrera.name,
                            }))}
                        />
                    </div>
                    <InputError
                        message={errors.carrera_id}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                    <div className="mt-1">
                        <SelectMenu
                            id="ciclo"
                            value={data.ciclo}
                            onChange={(value) => setData('ciclo', value)}
                            placeholder="Selecciona un ciclo"
                            options={ciclosDisponibles.map((ciclo) => ({
                                value: String(ciclo),
                                label: `Ciclo ${ciclo}`,
                            }))}
                        />
                    </div>
                    <InputError message={errors.ciclo} className="mt-2" />
                </div>

                {subject ? (
                    <div>
                        <InputLabel htmlFor="code" value="Código" />
                        <TextInput
                            id="code"
                            className="mt-1 block w-full"
                            value={data.code}
                            onChange={(e) =>
                                setData('code', e.target.value)
                            }
                        />
                        <InputError message={errors.code} className="mt-2" />
                    </div>
                ) : (
                    <div>
                        <InputLabel value="Código" />
                        <p className="mt-1 flex h-[42px] items-center rounded-xl border border-dashed border-brand-border bg-brand-hover px-3 text-sm text-brand-muted">
                            Se generará automáticamente
                            {carreraSeleccionada
                                ? ` (${carreraSeleccionada.code}-...)`
                                : ''}
                        </p>
                    </div>
                )}

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
