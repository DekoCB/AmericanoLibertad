<?php

use App\Modules\Asistencia\Services\AsistenciaInstitutoService;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public string $fecha = '';

    public function mount(): void
    {
        abort_unless(Auth::user()->hasPermissionTo('asistencia.ingreso_ver'), 403);

        $this->fecha = now()->format('Y-m-d');
    }

    public function with(AsistenciaInstitutoService $service): array
    {
        return ['filas' => $service->reporte($this->fecha)];
    }
}; ?>

<div>
    <x-slot name="header">
        <a href="{{ route('asistencia.index') }}" wire:navigate class="text-sm text-ink-faint hover:text-ink">← Asistencia</a>
        <h1 class="mt-1 font-display text-2xl text-ink">Ingreso al instituto</h1>
        <p class="mt-1 text-sm text-ink-dim">Quién entró al instituto y a qué hora, por día.</p>
    </x-slot>

    <div class="mb-4">
        <x-input-label for="fecha" value="Fecha" />
        <x-date-input wire:model.live="fecha" id="fecha" class="mt-1" />
    </div>

    <div class="divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
        @forelse ($filas as $fila)
            <div class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <p class="text-ink">{{ $fila['estudiante']->nombreCompleto() }}</p>
                @if ($fila['ingreso'])
                    <span @class([
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        'bg-ok/10 text-ok' => ! $fila['ingreso']->llego_tarde,
                        'bg-warn/10 text-warn' => $fila['ingreso']->llego_tarde,
                    ])>
                        {{ $fila['ingreso']->llego_tarde ? 'Tardanza' : 'Presente' }} · {{ $fila['ingreso']->created_at->format('H:i') }}
                    </span>
                @else
                    <span class="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-faint">Sin registrar</span>
                @endif
            </div>
        @empty
            <p class="px-4 py-8 text-center text-sm text-ink-faint">No hay estudiantes activos.</p>
        @endforelse
    </div>
</div>
