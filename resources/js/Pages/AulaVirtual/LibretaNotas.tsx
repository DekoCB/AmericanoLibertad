import CalificarModal from '@/Components/CalificarModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { PencilIcon, PlusIcon } from '@/Components/Icons';
import { useForm } from '@inertiajs/react';
import { Fragment, FormEvent, useState } from 'react';
import { Course, Libreta, LibretaGrupo } from '@/types/models';
import EvaluationForm from '../Evaluations/Form';

function EditarGrupoForm({
    grupo,
    onDone,
}: {
    grupo: LibretaGrupo;
    onDone: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        nombre: grupo.nombre,
        peso: grupo.peso,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('grupos-notas.update', grupo.id), { onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <InputLabel htmlFor="nombre" value="Nombre del grupo" />
                <TextInput
                    id="nombre"
                    className="mt-1 block w-full"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                />
                <InputError message={errors.nombre} className="mt-1" />
            </div>
            <div>
                <InputLabel htmlFor="peso" value="Peso (%)" />
                <TextInput
                    id="peso"
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 block w-full"
                    value={data.peso}
                    onChange={(e) => setData('peso', Number(e.target.value))}
                />
                <InputError message={errors.peso} className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    Guardar cambios
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onDone}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

function formatNota(valor: number | null): string {
    return valor === null ? '—' : valor.toFixed(2);
}

export default function LibretaNotas({
    course,
    libreta,
    canGrade,
    canManageEstructura,
}: {
    course: Course;
    libreta: Libreta;
    canGrade: boolean;
    canManageEstructura: boolean;
}) {
    const [editandoGrupo, setEditandoGrupo] = useState<LibretaGrupo | null>(
        null,
    );
    const [agregandoColumnaGrupo, setAgregandoColumnaGrupo] =
        useState<LibretaGrupo | null>(null);

    const { grupos, filas } = libreta;
    const totalPesos = grupos.reduce((sum, g) => sum + g.peso, 0);

    const columnasPorGrupo = (grupo: LibretaGrupo) =>
        grupo.evaluaciones.length +
        1 +
        (canManageEstructura && grupo.tipo !== 'comportamiento' ? 1 : 0);

    return (
        <div className="space-y-4">
            <div className="overflow-hidden overflow-x-auto rounded-lg border border-brand-border bg-brand-card">
                <table className="min-w-full divide-y divide-brand-border-faint text-center">
                    <thead className="bg-brand-thead">
                        <tr>
                            <th
                                colSpan={3}
                                className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted"
                            >
                                Total ({totalPesos.toFixed(2)}% / 100%)
                            </th>
                            {grupos.map((grupo) => (
                                <th
                                    key={grupo.id}
                                    colSpan={columnasPorGrupo(grupo)}
                                    className="whitespace-nowrap border-l border-brand-border-faint px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted"
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        {grupo.nombre} ({grupo.peso.toFixed(2)})
                                        {canManageEstructura && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditandoGrupo(grupo)
                                                }
                                                className="text-brand-muted hover:text-brand-navy"
                                                title="Editar grupo"
                                                aria-label="Editar grupo"
                                            >
                                                <PencilIcon className="size-3.5" />
                                            </button>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                                #
                            </th>
                            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-brand-muted">
                                Estudiantes
                            </th>
                            <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                                Prom. final
                            </th>
                            {grupos.map((grupo) => (
                                <Fragment key={grupo.id}>
                                    {grupo.evaluaciones.map((columna) => (
                                        <th
                                            key={columna.id}
                                            className="whitespace-nowrap border-l border-brand-border-faint px-3 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted"
                                        >
                                            {canGrade ? (
                                                <CalificarModal
                                                    evaluationId={columna.id}
                                                >
                                                    {(open) => (
                                                        <button
                                                            type="button"
                                                            onClick={open}
                                                            className="text-brand-link hover:underline"
                                                            title={columna.name}
                                                        >
                                                            {columna.label}
                                                        </button>
                                                    )}
                                                </CalificarModal>
                                            ) : (
                                                <span title={columna.name}>
                                                    {columna.label}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                    <th className="whitespace-nowrap border-l border-brand-border-faint px-3 py-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                                        Prom
                                    </th>
                                    {canManageEstructura &&
                                        grupo.tipo !== 'comportamiento' && (
                                            <th className="whitespace-nowrap border-l border-brand-border-faint px-2 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAgregandoColumnaGrupo(
                                                            grupo,
                                                        )
                                                    }
                                                    className="text-brand-muted hover:text-brand-navy"
                                                    title={`Agregar nota a ${grupo.nombre}`}
                                                    aria-label={`Agregar nota a ${grupo.nombre}`}
                                                >
                                                    <PlusIcon className="size-4" />
                                                </button>
                                            </th>
                                        )}
                                </Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-faint">
                        {filas.map((fila, index) => (
                            <tr key={fila.student_id}>
                                <td className="whitespace-nowrap px-4 py-2 text-sm text-brand-muted">
                                    {index + 1}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-left text-sm font-medium text-brand-ink-strong">
                                    {fila.nombre}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-bold text-brand-ink-strong">
                                    {formatNota(fila.promedioFinal)}
                                </td>
                                {grupos.map((grupo) => (
                                    <Fragment key={grupo.id}>
                                        {grupo.evaluaciones.map((columna) => (
                                            <td
                                                key={columna.id}
                                                className="whitespace-nowrap border-l border-brand-border-faint px-3 py-2 text-sm text-brand-ink"
                                            >
                                                {formatNota(
                                                    fila.notas[columna.id] ??
                                                        null,
                                                )}
                                            </td>
                                        ))}
                                        <td className="whitespace-nowrap border-l border-brand-border-faint px-3 py-2 text-sm font-semibold text-brand-ink-strong">
                                            {formatNota(
                                                fila.promediosPorGrupo[
                                                    grupo.id
                                                ] ?? null,
                                            )}
                                        </td>
                                        {canManageEstructura &&
                                            grupo.tipo !== 'comportamiento' && (
                                                <td className="border-l border-brand-border-faint" />
                                            )}
                                    </Fragment>
                                ))}
                            </tr>
                        ))}
                        {filas.length === 0 && (
                            <tr>
                                <td
                                    colSpan={
                                        3 +
                                        grupos.reduce(
                                            (sum, g) =>
                                                sum + columnasPorGrupo(g),
                                            0,
                                        )
                                    }
                                    className="px-4 py-6 text-center text-sm text-brand-muted"
                                >
                                    Esta sección no tiene estudiantes
                                    matriculados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editandoGrupo && (
                <Modal show onClose={() => setEditandoGrupo(null)}>
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Editar {editandoGrupo.nombre}
                        </h2>
                        <EditarGrupoForm
                            grupo={editandoGrupo}
                            onDone={() => setEditandoGrupo(null)}
                        />
                    </div>
                </Modal>
            )}

            {agregandoColumnaGrupo && (
                <Modal show onClose={() => setAgregandoColumnaGrupo(null)}>
                    <div className="p-6">
                        <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Nueva nota — {agregandoColumnaGrupo.nombre}
                        </h2>
                        <EvaluationForm
                            course={course}
                            defaultGrupoNotasId={agregandoColumnaGrupo.id}
                            onSuccess={() => setAgregandoColumnaGrupo(null)}
                            onCancel={() => setAgregandoColumnaGrupo(null)}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
