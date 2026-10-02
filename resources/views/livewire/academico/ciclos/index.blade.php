<?php

use App\Modules\Academico\Services\CicloService;
use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public function mount(): void
    {
        Gate::authorize('academico.ver');
    }

    public function with(CicloService $service): array
    {
        return [
            'ciclos' => $service->listar(),
        ];
    }
}; ?>

<div>
    <x-slot name="header">
        <h1 class="font-display text-2xl text-ink">Ciclos</h1>
        <p class="mt-1 text-sm text-ink-dim">Cada Ciclo nace de un Periodo (ver Académico → Periodos) — esta pantalla es solo de consulta.</p>
    </x-slot>

    @if (session('status'))
        <x-alert class="mb-4">{{ session('status') }}</x-alert>
    @endif

    <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table class="min-w-full divide-y divide-border text-sm">
            <thead class="bg-surface-2">
                <tr>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Nombre</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Tipo</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Fechas</th>
                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Estado</th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border">
                @forelse ($ciclos as $ciclo)
                    <tr wire:key="ciclo-{{ $ciclo->id }}">
                        <td class="px-4 py-3 font-medium text-ink">{{ $ciclo->nombre }}</td>
                        <td class="px-4 py-3 text-ink-dim">{{ $ciclo->tipo?->label() ?? '—' }}</td>
                        <td class="px-4 py-3 text-ink-dim">{{ $ciclo->fecha_inicio->format('d/m/Y') }} – {{ $ciclo->fecha_fin->format('d/m/Y') }}</td>
                        <td class="px-4 py-3">
                            <span @class([
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                'bg-ok/10 text-ok' => $ciclo->estado->value === 'activo',
                                'bg-info/10 text-info' => $ciclo->estado->value === 'planificado',
                                'bg-ink-faint/10 text-ink-faint' => $ciclo->estado->value === 'cerrado',
                            ])>
                                {{ $ciclo->estado->label() }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <button
                                type="button"
                                x-data
                                x-on:click="$dispatch('ver-ciclo', { cicloId: {{ $ciclo->id }} }); $dispatch('open-modal', 'ver-ciclo')"
                                class="text-sm font-medium text-accent hover:underline"
                            >Ver</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="px-4 py-8 text-center text-sm text-ink-faint">No hay ciclos registrados.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $ciclos->links() }}</div>

    <livewire:academico.ciclos.ficha-modal wire:key="ficha-ciclo-modal" />
</div>
