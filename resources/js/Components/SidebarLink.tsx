import { InertiaLinkProps, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

export default function SidebarLink({
    href,
    active,
    collapsed,
    icon,
    children,
    ...props
}: InertiaLinkProps & {
    active: boolean;
    collapsed: boolean;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            {...props}
            title={collapsed ? String(children) : undefined}
            className={`flex shrink-0 items-center overflow-hidden rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ease-in-out ${
                active
                    ? 'bg-brand-navy text-white'
                    : 'text-brand-muted hover:bg-brand-hover'
            }`}
        >
            <div
                className={`flex items-center transition-transform duration-300 ease-in-out ${
                    collapsed ? 'translate-x-[5.5px]' : 'translate-x-0'
                }`}
            >
                <span className="flex size-5 shrink-0 items-center justify-center">
                    {icon}
                </span>
                <span
                    className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin-left] duration-300 ease-in-out ${
                        collapsed
                            ? 'ml-0 max-w-0 opacity-0'
                            : 'ml-3 max-w-[180px] opacity-100'
                    }`}
                >
                    {children}
                </span>
            </div>
        </Link>
    );
}
