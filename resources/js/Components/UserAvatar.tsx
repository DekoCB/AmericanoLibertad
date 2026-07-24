import { UserCircleIcon } from '@/Components/Icons';

export default function UserAvatar({
    src,
    size = 'size-8',
    iconSize = 'size-6',
    className = '',
}: {
    src?: string | null;
    size?: string;
    iconSize?: string;
    className?: string;
}) {
    if (src) {
        return (
            <img
                src={src}
                alt="Foto de perfil"
                className={`${size} shrink-0 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <span
            className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-gold text-[oklch(30%_0.06_85)] ${className}`}
        >
            <UserCircleIcon className={iconSize} />
        </span>
    );
}
