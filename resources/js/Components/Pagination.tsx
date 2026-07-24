import { Link } from '@inertiajs/react';
import { PaginationLink } from '@/types/models';

export default function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className="mt-4 flex flex-wrap items-center gap-1">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url ?? '#'}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    preserveScroll
                    className={`rounded-xl px-3 py-1 text-sm ${
                        link.active
                            ? 'bg-brand-navy text-white'
                            : 'text-brand-muted hover:bg-brand-cream'
                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                />
            ))}
        </nav>
    );
}
