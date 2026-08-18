import { PhotoIcon } from '@/Components/Icons';

export default function CourseThumbnail({
    imageUrl,
    className = '',
}: {
    imageUrl: string | null;
    className?: string;
}) {
    return (
        <div className={`relative overflow-hidden bg-brand-hover ${className}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                <div className="flex size-full items-center justify-center text-brand-muted-soft">
                    <PhotoIcon className="size-8" />
                </div>
            )}
        </div>
    );
}
