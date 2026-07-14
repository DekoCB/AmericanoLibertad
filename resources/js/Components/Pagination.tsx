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
                    className={`rounded-md px-3 py-1 text-sm ${
                        link.active
                            ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                />
            ))}
        </nav>
    );
}
