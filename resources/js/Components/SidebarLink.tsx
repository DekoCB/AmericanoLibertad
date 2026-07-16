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
            className={`flex items-center overflow-hidden rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-in-out ${
                active
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
            }`}
        >
            <div
                className={`flex items-center transition-transform duration-300 ease-in-out ${
                    collapsed ? 'translate-x-1.5' : 'translate-x-0'
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
