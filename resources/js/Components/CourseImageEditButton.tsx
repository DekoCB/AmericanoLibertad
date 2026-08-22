import { CameraIcon } from '@/Components/Icons';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function ImageEditButton({
    uploadUrl,
    variant = 'overlay',
    label = 'Cambiar imagen',
}: {
    uploadUrl: string;
    variant?: 'overlay' | 'inline';
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = (file: File | null) => {
        if (!file) return;
        setUploading(true);
        router.post(
            uploadUrl,
            { _method: 'patch', imagen: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploading(false),
            },
        );
    };

    const styles =
        variant === 'overlay'
            ? 'absolute bottom-2 right-2 z-10 gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75'
            : 'gap-1.5 text-sm font-medium text-brand-link hover:underline';

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                    handleFile(e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
            />
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputRef.current?.click();
                }}
                disabled={uploading}
                className={`inline-flex items-center transition disabled:opacity-60 ${styles}`}
            >
                <CameraIcon className="size-3.5" />
                {uploading ? 'Subiendo...' : label}
            </button>
        </>
    );
}
