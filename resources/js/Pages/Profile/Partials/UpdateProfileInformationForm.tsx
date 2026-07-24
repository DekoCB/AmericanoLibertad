import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import UserAvatar from '@/Components/UserAvatar';
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm<{
            name: string;
            email: string;
        }>({
            name: user.name,
            email: user.email,
        });

    const {
        data: avatarData,
        setData: setAvatarData,
        post: postAvatar,
        errors: avatarErrors,
        processing: avatarProcessing,
        recentlySuccessful: avatarRecentlySuccessful,
    } = useForm<{ avatar: File | null }>({
        avatar: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    const submitAvatar: FormEventHandler = (e) => {
        e.preventDefault();

        postAvatar(route('profile.avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                setAvatarData('avatar', null);
                setPreview(null);
            },
        });
    };

    const selectFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setAvatarData('avatar', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const removeAvatar = () => {
        if (preview) {
            setAvatarData('avatar', null);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (!user.avatar_url) return;
        if (!confirm('¿Quitar tu foto de perfil?')) return;

        router.delete(route('profile.avatar.destroy'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-brand-ink-strong">
                    Información del perfil
                </h2>

                <p className="mt-1 text-sm text-brand-muted">
                    Actualiza la información de tu perfil y tu correo
                    electrónico.
                </p>
            </header>

            <form onSubmit={submitAvatar} className="mt-6">
                <InputLabel value="Foto de perfil" />
                <div className="mt-2 flex items-center gap-4">
                    <UserAvatar
                        src={preview ?? user.avatar_url}
                        size="size-16"
                        iconSize="size-10"
                    />
                    <div className="flex items-center gap-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Cambiar foto
                        </SecondaryButton>
                        {avatarData.avatar && (
                            <PrimaryButton
                                type="submit"
                                disabled={avatarProcessing}
                            >
                                Guardar
                            </PrimaryButton>
                        )}
                        {(preview || user.avatar_url) && (
                            <button
                                type="button"
                                onClick={removeAvatar}
                                className="text-sm text-red-600 hover:opacity-70"
                            >
                                Quitar foto
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={selectFile}
                    />
                </div>
                <InputError className="mt-2" message={avatarErrors.avatar} />
                <Transition
                    show={avatarRecentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="mt-2 text-sm text-brand-muted">
                        Foto guardada.
                    </p>
                </Transition>
            </form>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Nombre" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Correo electrónico" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-brand-ink-strong">
                            Tu correo electrónico no está verificado.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-brand-muted underline hover:text-brand-ink-strong focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2"
                            >
                                Haz clic aquí para reenviar el correo de
                                verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Se ha enviado un nuevo enlace de verificación a
                                tu correo electrónico.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        Guardar
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-brand-muted">Guardado.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
