import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SelectMenu from '@/Components/SelectMenu';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, Evaluation, evaluationTypeLabels } from '@/types/models';

export default function Form({
    course,
    evaluation,
    defaultSemana,
    defaultGrupoNotasId,
    onSuccess,
    onCancel,
}: {
    course: Course;
    evaluation?: Evaluation;
    defaultSemana?: number;
    defaultGrupoNotasId?: number;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: evaluation?.name ?? '',
        type: evaluation?.type ?? 'exam',
        weight: evaluation?.weight ?? 20,
        date: evaluation?.date ?? '',
        semana: evaluation?.semana
            ? String(evaluation.semana)
            : defaultSemana
              ? String(defaultSemana)
              : '',
        max_score: evaluation?.max_score ?? 20,
        intentos_permitidos: evaluation?.intentos_permitidos ?? 1,
        grupo_notas_id: evaluation?.grupo_notas_id ?? defaultGrupoNotasId ?? null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (evaluation) {
            put(route('evaluations.update', evaluation.id), { onSuccess });
        } else {
            post(route('courses.evaluations.store', course.id), {
                onSuccess,
            });
        }
    };

    const tipoOpciones = Object.entries(evaluationTypeLabels).filter(
        ([value]) => value !== 'comportamiento',
    );

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="name" value="Nombre" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        placeholder="Primer parcial"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="type" value="Tipo" />
                    <div className="mt-1">
                        <SelectMenu
                            id="type"
                            value={data.type}
                            onChange={(value) =>
                                setData(
                                    'type',
                                    value as Evaluation['type'],
                                )
                            }
                            options={tipoOpciones.map(([value, label]) => ({
                                value,
                                label,
                            }))}
                        />
                    </div>
                    <InputError message={errors.type} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="date" value="Fecha" />
                    <DateInput
                        id="date"
                        className="mt-1 block w-full"
                        value={data.date}
                        onChange={(v) => setData('date', v)}
                    />
                    <InputError message={errors.date} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="semana" value="Semana" />
                    <TextInput
                        id="semana"
                        type="number"
                        min={1}
                        max={20}
                        required
                        className="mt-1 block w-full"
                        value={data.semana}
                        onChange={(e) => setData('semana', e.target.value)}
                    />
                    <InputError message={errors.semana} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="weight"
                        value="Ponderación (%)"
                    />
                    <TextInput
                        id="weight"
                        type="number"
                        min={0}
                        max={100}
                        className="mt-1 block w-full"
                        value={data.weight}
                        onChange={(e) =>
                            setData('weight', Number(e.target.value))
                        }
                    />
                    <InputError message={errors.weight} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="max_score"
                        value="Puntaje máximo"
                    />
                    <TextInput
                        id="max_score"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.max_score}
                        onChange={(e) =>
                            setData('max_score', Number(e.target.value))
                        }
                    />
                    <InputError
                        message={errors.max_score}
                        className="mt-2"
                    />
                </div>

                {data.type === 'quiz' && (
                    <div>
                        <InputLabel
                            htmlFor="intentos_permitidos"
                            value="Intentos permitidos"
                        />
                        <TextInput
                            id="intentos_permitidos"
                            type="number"
                            min={1}
                            max={10}
                            className="mt-1 block w-full"
                            value={data.intentos_permitidos}
                            onChange={(e) =>
                                setData(
                                    'intentos_permitidos',
                                    Number(e.target.value),
                                )
                            }
                        />
                        <InputError
                            message={errors.intentos_permitidos}
                            className="mt-2"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    {evaluation ? 'Guardar cambios' : 'Guardar'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
