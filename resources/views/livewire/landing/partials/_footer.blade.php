@php
    $enlacesRapidos = [
        '#inicio' => 'Inicio',
        '#nosotros' => 'Nosotros',
        '#programas' => 'Programas',
        '#admision' => 'Admisión',
        '#docentes' => 'Docentes',
        '#contacto' => 'Contacto',
    ];
@endphp

<footer class="border-t border-white/5 bg-[#0f1b3d]">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div>
                <div class="flex items-center gap-3">
                    <img src="{{ asset('images/Logo.png') }}" alt="{{ $nombreInstitucion }}" class="h-9 w-9 rounded-lg object-contain">
                    <span class="font-sans text-sm font-extrabold text-white">{{ $nombreInstitucion }}</span>
                </div>
                <p class="mt-4 text-sm text-gray-400">
                    {{ $nombreLargo }}: educación técnica superior en Enfermería, Farmacia, Contabilidad y
                    Administración.
                </p>
                <p class="mt-4 font-sans text-sm font-bold text-blue-400">Formando profesionales para un futuro con éxito.</p>
            </div>

            <div>
                <h3 class="font-sans text-sm font-bold uppercase tracking-wide text-white">Enlaces Rápidos</h3>
                <ul class="mt-4 space-y-2.5">
                    @foreach ($enlacesRapidos as $href => $etiqueta)
                        <li>
                            <a href="{{ $href }}" class="text-sm text-gray-400 transition hover:text-white">{{ $etiqueta }}</a>
                        </li>
                    @endforeach
                </ul>
            </div>

            <div>
                <h3 class="font-sans text-sm font-bold uppercase tracking-wide text-white">Contacto</h3>
                <ul class="mt-4 space-y-3">
                    <li class="flex items-center gap-2 text-sm text-gray-400">
                        <x-heroicon-o-phone class="h-4 w-4 shrink-0 text-blue-400" />
                        {{ $whatsappNumeroVisible }}
                    </li>
                    <li class="flex items-center gap-2 text-sm text-gray-400">
                        <x-heroicon-o-envelope class="h-4 w-4 shrink-0 text-blue-400" />
                        <span class="break-all">{{ $emailContacto }}</span>
                    </li>
                    <li class="flex items-start gap-2 text-sm text-gray-400">
                        <x-heroicon-o-map-pin class="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                        {{ $direccion }}
                    </li>
                </ul>
            </div>
        </div>

        <div class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-center sm:flex-row sm:text-left">
            <p class="text-xs text-gray-500">© {{ now()->year }} {{ $nombreLargo }}. Todos los derechos reservados.</p>
            <a href="{{ route('login') }}" wire:navigate class="text-xs font-medium text-blue-400 hover:underline">Acceso al sistema</a>
        </div>
    </div>
</footer>
