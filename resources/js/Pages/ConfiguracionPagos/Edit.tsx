import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageTitle from '@/Components/PageTitle';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { CreditCardIcon } from '@/Components/Icons';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ConfiguracionPago } from '@/types/models';

export default function Edit({
    configuracion,
}: {
    configuracion: ConfiguracionPago;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        yape_numero: string;
        yape_qr: File | null;
        plin_numero: string;
        plin_qr: File | null;
        cuenta_detalle: string;
    }>({
        _method: 'put',
        yape_numero: configuracion.yape_numero ?? '',
        yape_qr: null,
        plin_numero: configuracion.plin_numero ?? '',
        plin_qr: null,
        cuenta_detalle: configuracion.cuenta_detalle ?? '',
    });

    const [yapePreview, setYapePreview] = useState<string | null>(null);
    const [plinPreview, setPlinPreview] = useState<string | null>(null);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('configuracion-pagos.update'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageTitle icon={<CreditCardIcon />}>
                    Métodos de pago
                </PageTitle>
            }
        >
            <Head title="Métodos de pago" />

            <div className="bg-page-pattern animate-drift-pattern min-h-[calc(100vh-4rem)] py-12">
                <div className="mx-auto max-w-3xl space-y-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-brand-muted">
                        Esta información es la que verán los alumnos al
                        declarar un pago por Yape, Plin o transferencia
                        bancaria.
                    </p>

                    <form
                        onSubmit={submit}
                        className="space-y-8 rounded-[20px] border border-brand-border bg-brand-card p-6"
                    >
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-4 rounded-xl border border-brand-border-faint p-4">
                                <h3 className="font-bold text-brand-ink-strong">
                                    Yape
                                </h3>
                                <div>
                                    <InputLabel
                                        htmlFor="yape_numero"
                                        value="Número"
                                    />
                                    <TextInput
                                        id="yape_numero"
                                        className="mt-1 block w-full"
                                        placeholder="900 000 000"
                                        value={data.yape_numero}
                                        onChange={(e) =>
                                            setData(
                                                'yape_numero',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.yape_numero}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="yape_qr"
                                        value="Código QR"
                                    />
                                    {(yapePreview ??
                                        configuracion.yape_qr_path) && (
                                        <img
                                            src={
                                                yapePreview ??
                                                `/storage/${configuracion.yape_qr_path}`
                                            }
                                            alt="QR de Yape"
                                            className="mt-2 size-32 rounded-lg border border-brand-border object-cover"
                                        />
                                    )}
                                    <input
                                        id="yape_qr"
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 block w-full text-sm text-brand-ink"
                                        onChange={(e) => {
                                            const file =
                                                e.target.files?.[0] ?? null;
                                            setData('yape_qr', file);
                                            setYapePreview(
                                                file
                                                    ? URL.createObjectURL(
                                                          file,
                                                      )
                                                    : null,
                                            );
                                        }}
                                    />
                                    <InputError
                                        message={errors.yape_qr}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl border border-brand-border-faint p-4">
                                <h3 className="font-bold text-brand-ink-strong">
                                    Plin
                                </h3>
                                <div>
                                    <InputLabel
                                        htmlFor="plin_numero"
                                        value="Número"
                                    />
                                    <TextInput
                                        id="plin_numero"
                                        className="mt-1 block w-full"
                                        placeholder="900 000 000"
                                        value={data.plin_numero}
                                        onChange={(e) =>
                                            setData(
                                                'plin_numero',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.plin_numero}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="plin_qr"
                                        value="Código QR"
                                    />
                                    {(plinPreview ??
                                        configuracion.plin_qr_path) && (
                                        <img
                                            src={
                                                plinPreview ??
                                                `/storage/${configuracion.plin_qr_path}`
                                            }
                                            alt="QR de Plin"
                                            className="mt-2 size-32 rounded-lg border border-brand-border object-cover"
                                        />
                                    )}
                                    <input
                                        id="plin_qr"
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 block w-full text-sm text-brand-ink"
                                        onChange={(e) => {
                                            const file =
                                                e.target.files?.[0] ?? null;
                                            setData('plin_qr', file);
                                            setPlinPreview(
                                                file
                                                    ? URL.createObjectURL(
                                                          file,
                                                      )
                                                    : null,
                                            );
                                        }}
                                    />
                                    <InputError
                                        message={errors.plin_qr}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="cuenta_detalle"
                                value="Datos de cuenta / tarjeta para transferencia"
                            />
                            <textarea
                                id="cuenta_detalle"
                                rows={5}
                                className="mt-1 block w-full rounded-xl border-brand-border bg-brand-input text-sm text-brand-ink shadow-sm focus:border-brand-navy focus:ring-brand-navy"
                                placeholder={
                                    'Banco: BCP\nTitular: Instituto Americano Libertad\nCuenta corriente: 000-00000000-0-00\nCCI: 002-000-000000000000-00'
                                }
                                value={data.cuenta_detalle}
                                onChange={(e) =>
                                    setData('cuenta_detalle', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.cuenta_detalle}
                                className="mt-1"
                            />
                        </div>

                        <PrimaryButton disabled={processing}>
                            Guardar cambios
                        </PrimaryButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
