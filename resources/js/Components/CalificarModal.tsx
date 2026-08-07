import Modal from '@/Components/Modal';
import { useState } from 'react';
import { Evaluation } from '@/types/models';
import GradesForm, { GradeRow } from '@/Pages/Grades/Form';

export default function CalificarModal({
    evaluationId,
    children,
}: {
    evaluationId: number;
    children: (open: () => void) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{
        evaluation: Evaluation;
        students: GradeRow[];
    } | null>(null);

    const abrir = () => {
        setOpen(true);
        setLoading(true);
        window.axios
            .get(route('evaluations.grades.edit', evaluationId))
            .then((response) => setData(response.data))
            .finally(() => setLoading(false));
    };

    const cerrar = () => {
        setOpen(false);
        setData(null);
    };

    return (
        <>
            {children(abrir)}
            <Modal show={open} onClose={cerrar} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        {data ? `Calificar — ${data.evaluation.name}` : 'Calificar'}
                    </h2>
                    {loading || !data ? (
                        <p className="py-8 text-center text-sm text-brand-muted">
                            Cargando...
                        </p>
                    ) : (
                        <GradesForm
                            evaluation={data.evaluation}
                            students={data.students}
                            onDone={cerrar}
                        />
                    )}
                </div>
            </Modal>
        </>
    );
}
