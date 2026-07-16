import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import SidebarLink from '@/Components/SidebarLink';
import {
    AcademicCapIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    BanknotesIcon,
    BookOpenIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    ClockIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    DocumentTextIcon,
    HomeIcon,
    QrCodeIcon,
    RectangleStackIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    UsersIcon,
    XMarkIcon,
} from '@/Components/Icons';
import { PageProps } from '@/types';
import { Transition } from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import { Fragment, PropsWithChildren, ReactNode, useState } from 'react';

const COLLAPSE_STORAGE_KEY = 'sidebar-collapsed';

function useSidebarCollapsed() {
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1',
    );

    const toggle = () => {
        setCollapsed((previous) => {
            const next = !previous;
            localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
            return next;
        });
    };

    return { collapsed, toggle };
}

function CollapsibleLabel({
    collapsed,
    className = '',
    children,
}: {
    collapsed: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin-left] duration-300 ease-in-out ${
                collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-3 max-w-[180px] opacity-100'
            } ${className}`}
        >
            {children}
        </span>
    );
}

function SidebarNav({
    nav,
    collapsed,
}: {
    nav: PageProps['auth']['nav'];
    collapsed: boolean;
}) {
    return (
        <nav className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-3 py-4">
            <SidebarLink
                href={route('dashboard')}
                active={route().current('dashboard')}
                collapsed={collapsed}
                icon={<HomeIcon />}
            >
                Tablero
            </SidebarLink>
            {nav?.students && (
                <SidebarLink
                    href={route('students.index')}
                    active={route().current('students.*')}
                    collapsed={collapsed}
                    icon={<UsersIcon />}
                >
                    Estudiantes
                </SidebarLink>
            )}
            {nav?.teachers && (
                <SidebarLink
                    href={route('teachers.index')}
                    active={route().current('teachers.*')}
                    collapsed={collapsed}
                    icon={<BriefcaseIcon />}
                >
                    Profesores
                </SidebarLink>
            )}
            {nav?.subjects && (
                <SidebarLink
                    href={route('subjects.index')}
                    active={route().current('subjects.*')}
                    collapsed={collapsed}
                    icon={<BookOpenIcon />}
                >
                    Materias
                </SidebarLink>
            )}
            {nav?.courses && (
                <SidebarLink
                    href={route('courses.index')}
                    active={route().current('courses.*')}
                    collapsed={collapsed}
                    icon={<RectangleStackIcon />}
                >
                    Cursos
                </SidebarLink>
            )}
            {nav?.carreras && (
                <SidebarLink
                    href={route('carreras.index')}
                    active={route().current('carreras.*')}
                    collapsed={collapsed}
                    icon={<AcademicCapIcon />}
                >
                    Carreras
                </SidebarLink>
            )}
            {nav?.matriculas && (
                <SidebarLink
                    href={route('matriculas.index')}
                    active={route().current('matriculas.*')}
                    collapsed={collapsed}
                    icon={<CreditCardIcon />}
                >
                    Matrículas
                </SidebarLink>
            )}
            {nav?.caja && (
                <SidebarLink
                    href={route('caja.index')}
                    active={
                        route().current('caja.*') ||
                        route().current('egresos.*')
                    }
                    collapsed={collapsed}
                    icon={<BanknotesIcon />}
                >
                    Flujo de caja
                </SidebarLink>
            )}
            {nav?.horarios && (
                <SidebarLink
                    href={route('horarios.index')}
                    active={route().current('horarios.*')}
                    collapsed={collapsed}
                    icon={<CalendarDaysIcon />}
                >
                    Horarios
                </SidebarLink>
            )}
            {nav?.asistencias && (
                <SidebarLink
                    href={route('asistencias.index')}
                    active={
                        route().current('asistencias.*') ||
                        route().current('courses.asistencias.*')
                    }
                    collapsed={collapsed}
                    icon={<QrCodeIcon />}
                >
                    Asistencia
                </SidebarLink>
            )}
            {nav?.aulaVirtual && (
                <SidebarLink
                    href={route('aula-virtual.index')}
                    active={route().current('aula-virtual.*')}
                    collapsed={collapsed}
                    icon={<ComputerDesktopIcon />}
                >
                    Aula virtual
                </SidebarLink>
            )}
            {nav?.registrosHoras && (
                <SidebarLink
                    href={route('registros-horas.index')}
                    active={route().current('registros-horas.*')}
                    collapsed={collapsed}
                    icon={<ClockIcon />}
                >
                    Horas y pagos
                </SidebarLink>
            )}
            {nav?.permisos && (
                <SidebarLink
                    href={route('permisos.index')}
                    active={route().current('permisos.*')}
                    collapsed={collapsed}
                    icon={<DocumentTextIcon />}
                >
                    Permisos
                </SidebarLink>
            )}
            {nav?.users && (
                <SidebarLink
                    href={route('users.index')}
                    active={route().current('users.*')}
                    collapsed={collapsed}
                    icon={<ShieldCheckIcon />}
                >
                    Usuarios
                </SidebarLink>
            )}
        </nav>
    );
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const nav = auth.nav;

    const { collapsed, toggle } = useSidebarCollapsed();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Desktop sidebar */}
            <aside
                className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-blue-950 transition-[width] duration-300 ease-in-out lg:flex ${
                    collapsed ? 'w-20' : 'w-64'
                }`}
            >
                <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
                    <div className="flex w-full items-center overflow-hidden">
                        <div
                            className={`flex items-center transition-transform duration-300 ease-in-out ${
                                collapsed ? 'translate-x-1.5' : 'translate-x-0'
                            }`}
                        >
                            <ApplicationLogo className="size-9 shrink-0 rounded-lg object-contain" />
                            <CollapsibleLabel
                                collapsed={collapsed}
                                className="text-sm font-semibold text-white"
                            >
                                I.S.E Libertad
                            </CollapsibleLabel>
                        </div>
                    </div>
                </div>

                <SidebarNav nav={nav} collapsed={collapsed} />

                <div className="border-t border-white/10 p-3">
                    <button
                        onClick={toggle}
                        className="flex w-full items-center overflow-hidden rounded-md px-3 py-2 text-sm font-medium text-blue-100 transition-colors duration-150 hover:bg-blue-900/60 hover:text-white"
                    >
                        <div
                            className={`flex items-center transition-transform duration-300 ease-in-out ${
                                collapsed ? 'translate-x-1.5' : 'translate-x-0'
                            }`}
                        >
                            <span className="flex size-5 shrink-0 items-center justify-center">
                                <ChevronLeftIcon
                                    className={`transition-transform duration-300 ease-in-out ${
                                        collapsed ? 'rotate-180' : ''
                                    }`}
                                />
                            </span>
                            <CollapsibleLabel collapsed={collapsed}>
                                Minimizar menú
                            </CollapsibleLabel>
                        </div>
                    </button>
                </div>

                <div className="border-t border-white/10 p-3">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex w-full items-center overflow-hidden rounded-md px-3 py-2 text-sm font-medium text-blue-100 transition-colors duration-150 hover:bg-blue-900/60 hover:text-white"
                            >
                                <div className="flex items-center">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white">
                                        <UserCircleIcon className="size-6" />
                                    </span>
                                    <CollapsibleLabel
                                        collapsed={collapsed}
                                        className="text-left"
                                    >
                                        {user.name}
                                    </CollapsibleLabel>
                                </div>
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content
                            align="left"
                            contentClasses="py-1 bg-white dark:bg-gray-700"
                        >
                            <Dropdown.Link href={route('profile.edit')}>
                                Perfil
                            </Dropdown.Link>
                            <Dropdown.Link
                                href={route('logout')}
                                method="post"
                                as="button"
                            >
                                Cerrar sesión
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 lg:hidden">
                <div className="flex items-center gap-2">
                    <ApplicationLogo className="size-9 rounded-lg object-contain" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        I.S.E Libertad
                    </span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-900"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile drawer */}
            <Transition show={mobileOpen} as={Fragment}>
                <div className="fixed inset-0 z-50 lg:hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => setMobileOpen(false)}
                        />
                    </Transition.Child>

                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-out duration-300"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-blue-950">
                            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <ApplicationLogo className="size-9 rounded-lg object-contain" />
                                    I.S.E Libertad
                                </span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="text-blue-100 hover:text-white"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <SidebarNav nav={nav} collapsed={false} />

                            <div className="border-t border-white/10 p-3">
                                <div className="px-3 py-2">
                                    <div className="text-sm font-medium text-white">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-blue-200">
                                        {user.email}
                                    </div>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-900/60 hover:text-white"
                                >
                                    <UserCircleIcon className="size-5" />
                                    Perfil
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm font-medium text-blue-100 hover:bg-blue-900/60 hover:text-white"
                                >
                                    <ArrowRightOnRectangleIcon className="size-5" />
                                    Cerrar sesión
                                </Link>
                            </div>
                        </aside>
                    </Transition.Child>
                </div>
            </Transition>

            {/* Main content */}
            <div className="flex flex-1 flex-col pt-16 lg:pt-0">
                {header && (
                    <header className="bg-white shadow dark:bg-gray-800">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
