import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Aula, Course, DiaSemana, diaSemanaLabels, Horario } from '@/types/models';

export default function SlotForm({
    course,
    horario,
    aulas,
    onSuccess,
    onCancel,
}: {
    course: Course;
    horario?: Horario;
    aulas: Aula[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const [nuevaAula, setNuevaAula] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        dia_semana: horario?.dia_semana ?? 'lunes',
        hora_inicio: horario?.hora_inicio?.slice(0, 5) ?? '08:00',
        hora_fin: horario?.hora_fin?.slice(0, 5) ?? '10:00',
        aula_id: horario?.aula_id ? String(horario.aula_id) : '',
        aula_nombre: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (horario) {
            put(route('courses.horarios.update', [course.id, horario.id]), {
                onSuccess,
            });
        } else {
            post(route('courses.horarios.store', course.id), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="dia_semana" value="Día" />
                    <div className="mt-1">
                        <SelectMenu
                            id="dia_semana"
                            value={data.dia_semana}
                            onChange={(value) =>
                                setData('dia_semana', value as DiaSemana)
                            }
                            options={Object.entries(diaSemanaLabels).map(
                                ([value, label]) => ({ value, label }),
                            )}
                        />
                    </div>
                    <InputError message={errors.dia_semana} className="mt-2" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <InputLabel htmlFor="hora_inicio" value="Hora inicio" />
                        <TextInput
                            id="hora_inicio"
                            type="time"
                            className="mt-1 block w-full"
                            value={data.hora_inicio}
                            onChange={(e) =>
                                setData('hora_inicio', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.hora_inicio}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="hora_fin" value="Hora fin" />
                        <TextInput
                            id="hora_fin"
                            type="time"
                            className="mt-1 block w-full"
                            value={data.hora_fin}
                            onChange={(e) =>
                                setData('hora_fin', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.hora_fin}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="aula_id" value="Aula" />
                        <button
                            type="button"
                            onClick={() => {
                                setNuevaAula((v) => !v);
                                setData('aula_id', '');
                                setData('aula_nombre', '');
                            }}
                            className="text-xs font-semibold text-brand-link hover:underline"
                        >
                            {nuevaAula
                                ? 'Elegir aula existente'
                                : '+ Nueva aula'}
                        </button>
                    </div>
                    <div className="mt-1">
                        {nuevaAula ? (
                            <TextInput
                                className="block w-full"
                                placeholder="Nombre del aula"
                                value={data.aula_nombre}
                                onChange={(e) =>
                                    setData('aula_nombre', e.target.value)
                                }
                            />
                        ) : (
                            <SelectMenu
                                id="aula_id"
                                value={data.aula_id}
                                onChange={(value) =>
                                    setData('aula_id', value)
                                }
                                placeholder="Selecciona un aula..."
                                options={aulas.map((aula) => ({
                                    value: String(aula.id),
                                    label: aula.nombre,
                                }))}
                            />
                        )}
                    </div>
                    <InputError message={errors.aula_id} className="mt-2" />
                    <InputError
                        message={errors.aula_nombre}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {horario ? 'Guardar cambios' : 'Agregar horario'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
