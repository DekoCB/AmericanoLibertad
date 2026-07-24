import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';

type Aula = { aula: string; total: number };

function AulaCard({
    aula,
    total,
    canManage,
}: {
    aula: string;
    total: number;
    canManage: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, reset } = useForm<{
        archivo: File | null;
    }>({ archivo: null });

    const abrirSelector = () => fileInputRef.current?.click();

    const subirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;
        if (!archivo) return;

        setData('archivo', archivo);
        post(route('horarios.aulas.importar', aula), {
            forceFormData: true,
            onSuccess: () => reset(),
            onFinish: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <div className="rounded-[20px] border border-brand-border bg-brand-card p-6">
            <p className="font-medium text-brand-ink-strong">{aula}</p>
            <p className="mt-1 text-sm text-brand-muted">
                {total} {total === 1 ? 'clase registrada' : 'clases registradas'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                    href={route('horarios.aulas.exportar', aula)}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-[12px] font-semibold uppercase tracking-widest text-brand-ink transition hover:bg-brand-hover"
                >
                    <ArrowDownTrayIcon className="size-4" />
                    Descargar Excel
                </a>

                {canManage && (
                    <>
                        <SecondaryButton
                            type="button"
                            onClick={abrirSelector}
                            disabled={processing}
                            className="inline-flex items-center gap-2 !text-[12px]"
                        >
                            <ArrowUpTrayIcon className="size-4" />
                            {processing ? 'Subiendo...' : 'Subir Excel'}
                        </SecondaryButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={subirArchivo}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default function Index({
    aulas,
    can,
}: {
    aulas: Aula[];
    can: { manage: boolean };
}) {
    const [creando, setCreando] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
    });

    const registrarAula = (e: FormEvent) => {
        e.preventDefault();
        post(route('horarios.aulas.store'), {
            onSuccess: () => {
                reset();
                setCreando(false);
            },
        });
    };

    const descargarPlantilla = () => {
        if (!data.nombre.trim()) return;
        window.location.href = route(
            'horarios.aulas.exportar',
            data.nombre.trim(),
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold text-brand-ink-strong">
                    Horarios
                </h2>
            }
        >
            <Head title="Horarios" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-5xl space-y-4 sm:px-6 lg:px-8">
                    {can.manage && (
                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setCreando(true)}>
                                Nueva aula
                            </PrimaryButton>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {aulas.map(({ aula, total }) => (
                            <AulaCard
                                key={aula}
                                aula={aula}
                                total={total}
                                canManage={can.manage}
                            />
                        ))}
                        {aulas.length === 0 && (
                            <div className="col-span-full rounded-lg bg-brand-card p-6 text-center text-sm text-brand-muted shadow-sm">
                                Todavía no hay aulas con horarios registrados.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                show={creando}
                onClose={() => {
                    setCreando(false);
                    reset();
                }}
            >
                <div className="p-6">
                    <h2 className="mb-6 text-center text-lg font-bold uppercase text-brand-ink-strong">
                        Nueva aula
                    </h2>
                    <form onSubmit={registrarAula} className="space-y-4">
                        <div>
                            <TextInput
                                id="nueva_aula"
                                className="block w-full"
                                placeholder="Aula 301"
                                value={data.nombre}
                                onChange={(e) =>
                                    setData('nombre', e.target.value)
                                }
                                isFocused
                            />
                            <InputError
                                message={errors.nombre}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <PrimaryButton
                                type="submit"
                                disabled={!data.nombre.trim() || processing}
                            >
                                Registrar aula
                            </PrimaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={descargarPlantilla}
                                disabled={!data.nombre.trim()}
                            >
                                Descargar plantilla en blanco
                            </SecondaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    setCreando(false);
                                    reset();
                                }}
                            >
                                Cancelar
                            </SecondaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
