import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Course, PeriodoAcademico } from '@/types/models';

export default function PeriodoFechasForm({
    course,
    periodo,
    onDone,
}: {
    course: Course;
    periodo: Pick<PeriodoAcademico, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin'>;
    onDone?: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        fecha_inicio: periodo.fecha_inicio.slice(0, 10),
        fecha_fin: periodo.fecha_fin.slice(0, 10),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('courses.periodo.update', course.id), {
            preserveScroll: true,
            onSuccess: () => onDone?.(),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-brand-border bg-brand-hover p-4"
        >
            <div>
                <p className="text-sm font-semibold text-brand-ink-strong">
                    Fechas del período {periodo.nombre}
                </p>
                <p className="text-xs text-brand-muted">
                    Estas fechas aplican a todas las secciones y matrículas
                    vinculadas a este período.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="fecha_inicio" value="Fecha de inicio" />
                    <DateInput
                        id="fecha_inicio"
                        className="mt-1 block w-full"
                        value={data.fecha_inicio}
                        onChange={(v) => setData('fecha_inicio', v)}
                    />
                    <InputError message={errors.fecha_inicio} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="fecha_fin" value="Fecha de fin" />
                    <DateInput
                        id="fecha_fin"
                        className="mt-1 block w-full"
                        value={data.fecha_fin}
                        onChange={(v) => setData('fecha_fin', v)}
                    />
                    <InputError message={errors.fecha_fin} className="mt-2" />
                </div>
            </div>

            <PrimaryButton disabled={processing}>Guardar fechas</PrimaryButton>
        </form>
    );
}
