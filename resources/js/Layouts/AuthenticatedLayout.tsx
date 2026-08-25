import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/Modal';
import NotificationBell from '@/Components/NotificationBell';
import PaymentAlertBanner from '@/Components/PaymentAlertBanner';
import SidebarLink from '@/Components/SidebarLink';
import UserAvatar from '@/Components/UserAvatar';
import HelpContent from '@/Pages/Help/HelpContent';
import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import {
    AcademicCapIcon,
    ArrowRightOnRectangleIcon,
    ArrowTrendingUpIcon,
    Bars3Icon,
    BanknotesIcon,
    BookOpenIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    ChevronLeftIcon,
    ClockIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    DocumentTextIcon,
    HomeIcon,
    InboxIcon,
    MoonIcon,
    QrCodeIcon,
    QuestionMarkCircleIcon,
    RectangleStackIcon,
    ShieldCheckIcon,
    SunIcon,
    UsersIcon,
    XMarkIcon,
} from '@/Components/Icons';
import { PageProps } from '@/types';
import { Theme, useTheme } from '@/theme';
import { Transition } from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import {
    CSSProperties,
    Fragment,
    PropsWithChildren,
    ReactNode,
    useEffect,
    useState,
} from 'react';

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

function ThemeToggle({
    theme,
    setTheme,
}: {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-brand-ink-strong">
                Apariencia
            </h3>
            <p className="mt-1 text-sm text-brand-muted">
                Elige cómo quieres ver el sistema en este dispositivo.
            </p>
            <div className="mt-3 inline-flex rounded-xl border border-brand-border p-1">
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        theme === 'light'
                            ? 'bg-brand-navy text-white'
                            : 'text-brand-muted hover:bg-brand-hover'
                    }`}
                >
                    <SunIcon className="size-4" />
                    Claro
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        theme === 'dark'
                            ? 'bg-brand-navy text-white'
                            : 'text-brand-muted hover:bg-brand-hover'
                    }`}
                >
                    <MoonIcon className="size-4" />
                    Oscuro
                </button>
            </div>
        </div>
    );
}

function CollapsibleLabel({
    collapsed,
    className = '',
    style,
    children,
}: {
    collapsed: boolean;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) {
    return (
        <span
            className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin-left] duration-300 ease-in-out ${
                collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-3 max-w-[180px] opacity-100'
            } ${className}`}
            style={style}
        >
            {children}
        </span>
    );
}

function SidebarSectionLabel({
    collapsed,
    children,
}: {
    collapsed: boolean;
    children: ReactNode;
}) {
    return (
        <div className="relative mt-4 h-5 shrink-0 px-3 first:mt-0">
            <div
                className={`absolute inset-x-3 top-1/2 -translate-y-1/2 border-t transition-opacity duration-300 ease-in-out ${
                    collapsed ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ borderColor: 'var(--sidebar-divider)' }}
            />
            <span
                className={`absolute left-3 top-1/2 block -translate-y-1/2 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-brand-muted-soft transition-[opacity,max-width] duration-300 ease-in-out ${
                    collapsed
                        ? 'max-w-0 opacity-0'
                        : 'max-w-[180px] opacity-100'
                }`}
            >
                {children}
            </span>
        </div>
    );
}

function SidebarNav({
    nav,
    collapsed,
}: {
    nav: PageProps['auth']['nav'];
    collapsed: boolean;
}) {
    const academicoVisible = Boolean(
        nav?.students ||
            nav?.teachers ||
            nav?.subjects ||
            nav?.courses ||
            nav?.carreras ||
            nav?.admisiones ||
            nav?.horarios ||
            nav?.asistencias ||
            nav?.aulaVirtual ||
            nav?.periodosAcademicos,
    );
    const financieroVisible = Boolean(
        nav?.matriculas ||
            nav?.pagos ||
            nav?.caja ||
            nav?.reportes ||
            nav?.registrosHoras ||
            nav?.misPagos ||
            nav?.configuracionPagos,
    );
    const administracionVisible = Boolean(nav?.permisos || nav?.users);

    return (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            <SidebarSectionLabel collapsed={collapsed}>
                General
            </SidebarSectionLabel>
            <SidebarLink
                href={route('dashboard')}
                active={route().current('dashboard')}
                collapsed={collapsed}
                icon={<HomeIcon />}
            >
                Dashboard
            </SidebarLink>

            {academicoVisible && (
                <>
                    <SidebarSectionLabel collapsed={collapsed}>
                        Académico
                    </SidebarSectionLabel>
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
                    {nav?.notas && (
                        <SidebarLink
                            href={route('grades.index')}
                            active={
                                route().current('grades.*') ||
                                route().current('evaluations.grades.*')
                            }
                            collapsed={collapsed}
                            icon={<CheckBadgeIcon />}
                        >
                            Notas
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
                    {nav?.periodosAcademicos && (
                        <SidebarLink
                            href={route('periodos-academicos.index')}
                            active={route().current(
                                'periodos-academicos.*',
                            )}
                            collapsed={collapsed}
                            icon={<CalendarDaysIcon />}
                        >
                            Períodos académicos
                        </SidebarLink>
                    )}
                    {nav?.subjects && (
                        <SidebarLink
                            href={route('subjects.index')}
                            active={route().current('subjects.*')}
                            collapsed={collapsed}
                            icon={<BookOpenIcon />}
                        >
                            Cursos
                        </SidebarLink>
                    )}
                    {nav?.courses && (
                        <SidebarLink
                            href={route('courses.index')}
                            active={route().current('courses.*')}
                            collapsed={collapsed}
                            icon={<RectangleStackIcon />}
                        >
                            Secciones
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
                    {nav?.admisiones && (
                        <SidebarLink
                            href={route('admisiones.index')}
                            active={route().current('admisiones.*')}
                            collapsed={collapsed}
                            icon={<InboxIcon />}
                        >
                            Solicitudes de admisión
                        </SidebarLink>
                    )}
                </>
            )}

            {financieroVisible && (
                <>
                    <SidebarSectionLabel collapsed={collapsed}>
                        Financiero
                    </SidebarSectionLabel>
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
                    {nav?.pagos && (
                        <SidebarLink
                            href={route('pagos.index')}
                            active={route().current('pagos.*')}
                            collapsed={collapsed}
                            icon={<CreditCardIcon />}
                        >
                            Pagos
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
                    {nav?.configuracionPagos && (
                        <SidebarLink
                            href={route('configuracion-pagos.edit')}
                            active={route().current(
                                'configuracion-pagos.*',
                            )}
                            collapsed={collapsed}
                            icon={<CreditCardIcon />}
                        >
                            Métodos de pago
                        </SidebarLink>
                    )}
                    {nav?.reportes && (
                        <SidebarLink
                            href={route('reportes.index')}
                            active={route().current('reportes.*')}
                            collapsed={collapsed}
                            icon={<ArrowTrendingUpIcon />}
                        >
                            Reportes
                        </SidebarLink>
                    )}
                    {nav?.registrosHoras && (
                        <SidebarLink
                            href={route('registros-horas.index')}
                            active={route().current('registros-horas.*')}
                            collapsed={collapsed}
                            icon={<ClockIcon />}
                        >
                            Salarios
                        </SidebarLink>
                    )}
                    {nav?.misPagos && (
                        <SidebarLink
                            href={route('mis-pagos.index')}
                            active={route().current('mis-pagos.*')}
                            collapsed={collapsed}
                            icon={<CreditCardIcon />}
                        >
                            Mis pagos
                        </SidebarLink>
                    )}
                </>
            )}

            {administracionVisible && (
                <>
                    <SidebarSectionLabel collapsed={collapsed}>
                        Administración
                    </SidebarSectionLabel>
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
                </>
            )}
        </nav>
    );
}

export default function Authenticated({
    header,
    headerImage,
    children,
}: PropsWithChildren<{ header?: ReactNode; headerImage?: string }>) {
    const { props, url } = usePage<PageProps>();
    const { auth } = props;
    const user = auth.user;
    const nav = auth.nav;

    const { collapsed, toggle } = useSidebarCollapsed();
    const { theme, setTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-brand-cream">
            {/* Desktop sidebar */}
            <aside
                className={`sticky top-0 z-10 hidden h-screen shrink-0 flex-col border-r border-brand-border bg-brand-surface transition-[width] duration-300 ease-in-out lg:flex ${
                    collapsed ? 'w-20' : 'w-64'
                }`}
            >
                <div className="flex h-16 items-center justify-center border-b border-brand-border px-4">
                    <div className="flex w-full items-center overflow-hidden">
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center transition-transform duration-300 ease-in-out ${
                                collapsed
                                    ? 'translate-x-[5.5px]'
                                    : 'translate-x-0'
                            }`}
                        >
                            <ApplicationLogo className="size-9 shrink-0 rounded-full object-contain" />
                            <CollapsibleLabel
                                collapsed={collapsed}
                                className="text-sm font-semibold text-brand-ink-strong"
                            >
                                I.E.S. Libertad
                            </CollapsibleLabel>
                        </Link>
                    </div>
                </div>

                <SidebarNav nav={nav} collapsed={collapsed} />

                <div className="border-t border-brand-border p-3">
                    <button
                        onClick={toggle}
                        className="flex w-full items-center overflow-hidden rounded-xl px-3 py-2 text-sm font-medium text-brand-muted transition-colors duration-150 hover:bg-brand-cream"
                    >
                        <div
                            className={`flex items-center transition-transform duration-300 ease-in-out ${
                                collapsed
                                    ? 'translate-x-[5.5px]'
                                    : 'translate-x-0'
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

                <div className="border-t border-brand-border p-3">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex w-full items-center overflow-hidden rounded-xl px-3 py-2 text-sm font-medium text-brand-muted transition-colors duration-150 hover:bg-brand-cream"
                            >
                                <div className="flex items-center">
                                    <UserAvatar src={user.avatar_url} />
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
                            direction="up"
                            contentClasses="py-1 bg-brand-card"
                        >
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm leading-5 text-brand-ink transition duration-150 ease-in-out hover:bg-brand-cream focus:bg-brand-cream focus:outline-none"
                            >
                                <Cog6ToothIcon className="size-4" />
                                Configuración
                            </button>
                            <button
                                type="button"
                                onClick={() => setHelpOpen(true)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm leading-5 text-brand-ink transition duration-150 ease-in-out hover:bg-brand-cream focus:bg-brand-cream focus:outline-none"
                            >
                                <QuestionMarkCircleIcon className="size-4" />
                                Obtener ayuda
                            </button>
                            <Dropdown.Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-red-600 hover:bg-red-50"
                            >
                                <ArrowRightOnRectangleIcon className="size-4" />
                                Cerrar sesión
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-brand-border bg-brand-card px-4 lg:hidden">
                <Link href={route('dashboard')} className="flex items-center gap-2">
                    <ApplicationLogo className="size-9 rounded-full object-contain" />
                    <span className="text-sm font-semibold text-brand-ink-strong">
                        I.E.S. Libertad
                    </span>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl p-2 text-brand-muted hover:bg-brand-cream hover:text-brand-ink"
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
                        <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-brand-surface">
                            <div className="flex h-16 items-center justify-between border-b border-brand-border px-4">
                                <Link
                                    href={route('dashboard')}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 text-sm font-semibold text-brand-ink-strong"
                                >
                                    <ApplicationLogo className="size-9 rounded-full object-contain" />
                                    I.E.S. Libertad
                                </Link>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="text-brand-muted hover:opacity-70"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <SidebarNav nav={nav} collapsed={false} />

                            <div className="border-t border-brand-border p-3">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <UserAvatar src={user.avatar_url} />
                                    <div>
                                        <div className="text-sm font-medium text-brand-ink-strong">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-brand-muted-soft">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileOpen(false);
                                        setSettingsOpen(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm font-medium text-brand-muted hover:bg-brand-cream"
                                >
                                    <Cog6ToothIcon className="size-5" />
                                    Configuración
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileOpen(false);
                                        setHelpOpen(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm font-medium text-brand-muted hover:bg-brand-cream"
                                >
                                    <QuestionMarkCircleIcon className="size-5" />
                                    Obtener ayuda
                                </button>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm font-medium text-red-600 hover:bg-red-50"
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
                <div className="flex justify-end px-4 pt-3 sm:px-6 lg:px-8">
                    <NotificationBell />
                </div>

                {header && (
                    <header
                        className="relative overflow-hidden border-b border-brand-border bg-brand-card bg-cover bg-center"
                        style={
                            headerImage
                                ? {
                                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${headerImage})`,
                                  }
                                : undefined
                        }
                    >
                        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="relative flex-1">
                    <PaymentAlertBanner />
                    <div key={url} className="relative animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            <Modal
                show={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                maxWidth="2xl"
            >
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    <div className="relative mb-6 flex items-center justify-center">
                        <h2 className="text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Configuración
                        </h2>
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="absolute right-0 text-brand-muted hover:text-brand-ink"
                        >
                            <XMarkIcon className="size-5" />
                        </button>
                    </div>
                    <div className="space-y-8">
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                        <div className="border-t border-brand-border pt-8">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={false}
                            />
                        </div>
                        <UpdatePasswordForm />
                        <DeleteUserForm />
                    </div>
                </div>
            </Modal>

            <Modal
                show={helpOpen}
                onClose={() => setHelpOpen(false)}
                maxWidth="lg"
            >
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    <div className="relative mb-6 flex items-center justify-center">
                        <h2 className="text-center text-lg font-bold uppercase text-brand-ink-strong">
                            Ayuda
                        </h2>
                        <button
                            onClick={() => setHelpOpen(false)}
                            className="absolute right-0 text-brand-muted hover:text-brand-ink"
                        >
                            <XMarkIcon className="size-5" />
                        </button>
                    </div>
                    <HelpContent />
                </div>
            </Modal>
        </div>
    );
}
