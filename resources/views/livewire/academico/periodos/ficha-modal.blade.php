<?php

use App\Modules\Academico\Models\Periodo;
use App\Modules\Academico\Services\CicloService;
use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\On;
use Livewire\Volt\Component;

/**
 * Modal "Ver" de academico/periodos/index.blade.php: un Periodo no gestiona
 * directamente sus propios periodos de matrícula -- esos viven en su Ciclo
 * espejo (ver PeriodoService::crear()). Este componente delega en el mismo
 * CicloService::crearPeriodoMatricula() que ya usa
 * academico/ciclos/ficha-modal.php, reusando también el mismo parcial de
 * detalle (x-academico.detalle-ciclo), para no duplicar esa lógica.
 */
new class extends Component
{
    public ?int $periodoId = null;

    public string $fechaInicio = '';

    public string $fechaFin = '';

    #[On('ver-periodo')]
    public function abrir(int $periodoId): void
    {
        Gate::authorize('academico.ver');

        $this->periodoId = $periodoId;
        $this->reset(['fechaInicio', 'fechaFin']);
    }

    public function crearPeriodo(CicloService $service): void
    {
        Gate::authorize('academico.gestionar');

        $this->validate([
            'fechaInicio' => 'required|date',
            'fechaFin' => 'required|date',
        ]);

        $service->crearPeriodoMatricula($this->periodo()->ciclo, $this->fechaInicio, $this->fechaFin);

        $this->reset(['fechaInicio', 'fechaFin']);
    }

    private function periodo(): Periodo
    {
        return Periodo::query()->findOrFail($this->periodoId);
    }

    public function with(): array
    {
        $periodo = $this->periodoId ? Periodo::query()->find($this->periodoId) : null;
        $ciclo = $periodo?->ciclo;

        return [
            'periodo' => $periodo,
            'ciclo' => $ciclo,
            'periodos' => $ciclo?->periodosMatricula()->latest('fecha_inicio')->get(),
            'horarios' => $ciclo?->horarios()->with(['curso', 'docente', 'aula', 'carrera', 'dias'])->get(),
        ];
    }
}; ?>

<div>
    <x-modal name="ver-periodo" :tv="true" max-width="2xl">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
                <h2 class="font-display text-lg text-ink">{{ $periodo?->nombreCompleto() ?? 'Periodo' }}</h2>
                @if ($ciclo)
                    <p class="text-sm text-ink-dim">{{ $ciclo->fecha_inicio->format('d/m/Y') }} – {{ $ciclo->fecha_fin->format('d/m/Y') }}</p>
                @endif
            </div>
            <button type="button" x-on:click="$dispatch('close')" class="rounded-md p-1.5 text-ink-faint transition hover:bg-surface-2 hover:text-ink" aria-label="Cerrar">
                <x-heroicon-o-x-mark class="h-5 w-5" />
            </button>
        </div>

        <div class="max-h-[75vh] overflow-y-auto p-6" wire:loading.class="opacity-50">
            @if ($ciclo)
                <x-academico.detalle-ciclo :ciclo="$ciclo" :periodos="$periodos" :horarios="$horarios" />
            @else
                <p class="py-8 text-center text-sm text-ink-faint">Cargando…</p>
            @endif
        </div>
    </x-modal>
</div>
