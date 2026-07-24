import DateInput from '@/Components/DateInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { Carrera, Student } from '@/types/models';

type StudentOption = Pick<
    Student,
    'id' | 'first_name' | 'last_name' | 'carrera_id' | 'ciclo' | 'turno'
>;

export default function Form({
    students,
    carreras,
    onSuccess,
    onCancel,
}: {
    students: StudentOption[];
    carreras: Carrera[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        carrera_id: '',
        ciclo: '1',
        turno: '',
        period: '',
        monto_matricula: '50',
        fecha_matricula: today,
    });

    const montoSugerido = useMemo(() => {
        const ciclo = Number(data.ciclo);
        return ciclo >= 2 ? '150' : '50';
    }, [data.ciclo]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('matriculas.store'), { onSuccess });
    };

    const onStudentChange = (studentId: string) => {
        setData((prev) => {
            const student = students.find((s) => String(s.id) === studentId);
            return {
                ...prev,
                student_id: studentId,
                carrera_id: student?.carrera_id
                    ? String(student.carrera_id)
                    : prev.carrera_id,
                ciclo: student?.ciclo ? String(student.ciclo) : prev.ciclo,
                turno: student?.turno ?? prev.turno,
            };
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputLabel htmlFor="student_id" value="Estudiante" />
                    <select
                        id="student_id"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.student_id}
                        onChange={(e) => onStudentChange(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.first_name} {student.last_name}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.student_id}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="carrera_id" value="Carrera" />
                    <select
                        id="carrera_id"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.carrera_id}
                        onChange={(e) =>
                            setData('carrera_id', e.target.value)
                        }
                    >
                        <option value="">Seleccionar...</option>
                        {carreras.map((carrera) => (
                            <option key={carrera.id} value={carrera.id}>
                                {carrera.name}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.carrera_id}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="ciclo" value="Ciclo" />
                    <TextInput
                        id="ciclo"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full"
                        value={data.ciclo}
                        onChange={(e) => setData('ciclo', e.target.value)}
                    />
                    <InputError message={errors.ciclo} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="turno" value="Turno" />
                    <select
                        id="turno"
                        className="mt-1 block w-full rounded-xl border-brand-border bg-brand-card shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                        value={data.turno}
                        onChange={(e) => setData('turno', e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                        <option value="noche">Noche</option>
                    </select>
                    <InputError message={errors.turno} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="period" value="Periodo" />
                    <TextInput
                        id="period"
                        className="mt-1 block w-full"
                        placeholder="2026-II"
                        value={data.period}
                        onChange={(e) => setData('period', e.target.value)}
                    />
                    <InputError message={errors.period} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="fecha_matricula"
                        value="Fecha de matrícula"
                    />
                    <DateInput
                        id="fecha_matricula"
                        className="mt-1 block w-full"
                        value={data.fecha_matricula}
                        onChange={(v) => setData('fecha_matricula', v)}
                    />
                    <InputError
                        message={errors.fecha_matricula}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="monto_matricula"
                        value={`Monto de matrícula (tarifario sugerido: S/ ${montoSugerido})`}
                    />
                    <TextInput
                        id="monto_matricula"
                        type="number"
                        step="0.01"
                        min={0}
                        className="mt-1 block w-full"
                        value={data.monto_matricula}
                        onChange={(e) =>
                            setData('monto_matricula', e.target.value)
                        }
                    />
                    <InputError
                        message={errors.monto_matricula}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <PrimaryButton disabled={processing}>
                    Registrar matrícula
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}
