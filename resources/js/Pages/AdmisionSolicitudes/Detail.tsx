import SelectMenu from '@/Components/SelectMenu';
import PrimaryButton from '@/Components/PrimaryButton';
import { ArrowDownTrayIcon } from '@/Components/Icons';
import { useForm } from '@inertiajs/react';
import { ReactNode } from 'react';
import {
    AdmissionApplication,
    admisionEstadoLabels,
    turnoLabels,
} from '@/types/models';
import { formatDate } from '@/utils/date';

const documentFields: {
    field:
        | 'documento_dni_path'
        | 'documento_certificado_path'
        | 'documento_partida_path'
        | 'documento_foto_path';
    campo: string;
    label: string;
}[] = [
    { field: 'documento_dni_path', campo: 'documento_dni', label: 'Copia de DNI' },
    {
        field: 'documento_certificado_path',
        campo: 'documento_certificado',
        label: 'Certificado de estudios',
    },
    {
        field: 'documento_partida_path',
        campo: 'documento_partida',
        label: 'Partida de nacimiento',
    },
    { field: 'documento_foto_path', campo: 'documento_foto', label: 'Foto tamaño carnet' },
];

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                {label}
            </dt>
            <dd className="mt-0.5 text-sm text-brand-ink-strong">
                {value || '—'}
            </dd>
        </div>
    );
}

export default function Detail({
    solicitud,
}: {
    solicitud: AdmissionApplication;
}) {
    const { data, setData, patch, processing } = useForm({
        estado: solicitud.estado,
    });

    const guardarEstado = () => {
        patch(route('admisiones.estado', solicitud.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-bold text-brand-ink-strong">
                    Datos del estudiante
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <InfoRow
                        label="Nombres completos"
                        value={`${solicitud.nombres} ${solicitud.apellido_paterno} ${solicitud.apellido_materno}`}
                    />
                    <InfoRow label="DNI" value={solicitud.dni} />
                    <InfoRow
                        label="Sexo"
                        value={
                            solicitud.sexo === 'masculino'
                                ? 'Masculino'
                                : 'Femenino'
                        }
                    />
                    <InfoRow
                        label="Fecha de nacimiento"
                        value={formatDate(solicitud.fecha_nacimiento)}
                    />
                    <InfoRow label="Teléfono" value={solicitud.telefono} />
                    <InfoRow label="Correo" value={solicitud.correo} />
                    <InfoRow label="Carrera" value={solicitud.carrera?.name} />
                    <InfoRow
                        label="Turno"
                        value={turnoLabels[solicitud.turno]}
                    />
                    <InfoRow
                        label="Colegio de procedencia"
                        value={solicitud.colegio_procedencia}
                    />
                    <InfoRow
                        label="Lugar de procedencia"
                        value={solicitud.lugar_procedencia}
                    />
                </dl>
            </div>

            {(solicitud.apoderado_nombres || solicitud.apoderado_dni) && (
                <div>
                    <h3 className="text-base font-bold text-brand-ink-strong">
                        Padre, madre o apoderado
                    </h3>
                    <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <InfoRow
                            label="Nombres"
                            value={solicitud.apoderado_nombres}
                        />
                        <InfoRow label="DNI" value={solicitud.apoderado_dni} />
                        <InfoRow
                            label="Parentesco"
                            value={solicitud.apoderado_parentesco}
                        />
                        <InfoRow
                            label="Teléfono"
                            value={solicitud.apoderado_telefono}
                        />
                        <InfoRow
                            label="Correo"
                            value={solicitud.apoderado_correo}
                        />
                    </dl>
                </div>
            )}

            <div>
                <h3 className="text-base font-bold text-brand-ink-strong">
                    Documentos
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {documentFields.map(({ field, campo, label }) =>
                        solicitud[field] ? (
                            <a
                                key={campo}
                                href={route('admisiones.documentos', [
                                    solicitud.id,
                                    campo,
                                ])}
                                className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-ink transition hover:border-brand-navy hover:text-brand-navy"
                            >
                                <ArrowDownTrayIcon className="size-4" />
                                {label}
                            </a>
                        ) : (
                            <div
                                key={campo}
                                className="flex items-center gap-2 rounded-xl border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted"
                            >
                                {label} — no adjuntado
                            </div>
                        ),
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-brand-border-faint pt-4">
                <div className="w-52">
                    <label className="mb-1 block text-sm font-medium text-brand-ink-strong">
                        Estado de la solicitud
                    </label>
                    <SelectMenu
                        value={data.estado}
                        onChange={(value) =>
                            setData(
                                'estado',
                                value as AdmissionApplication['estado'],
                            )
                        }
                        options={Object.entries(admisionEstadoLabels).map(
                            ([value, label]) => ({ value, label }),
                        )}
                    />
                </div>
                <PrimaryButton
                    onClick={guardarEstado}
                    disabled={processing || data.estado === solicitud.estado}
                >
                    Guardar estado
                </PrimaryButton>
            </div>
        </div>
    );
}
