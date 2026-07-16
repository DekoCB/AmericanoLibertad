import ApplicationLogo from '@/Components/ApplicationLogo';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-blue-950 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-3">
                <ApplicationLogo className="size-16 rounded-xl object-contain" />
                <span className="text-center text-lg font-semibold text-white">
                    Instituto Americano Libertad
                </span>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-800">
                {children}
            </div>
        </div>
    );
}
