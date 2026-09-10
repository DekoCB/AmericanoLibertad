<?php

use App\Modules\AulaVirtual\Services\CursoVirtualService;
use App\Shared\Enums\RolEnum;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public ?int $cicloId = null;

    public ?int $carreraId = null;

    public ?int $cicloCurricular = null;

    public function mount(): void
    {
        $user = Auth::user();

        abort_unless(
            $user->hasAnyPermission(['aula_virtual.ver', 'aula_virtual.gestionar_propio', 'aula_virtual.ver_propio']),
            403,
        );
    }

    public function seleccionarGrupo(int $cicloId): void
    {
        $this->cicloId = $cicloId;
    }

    public function seleccionarCarrera(int $carreraId): void
    {
        $this->carreraId = $carreraId;
    }

    public function seleccionarCicloCurricular(int $cicloCurricular): void
    {
        $this->cicloCurricular = $cicloCurricular;
    }

    public function volverAGrupos(): void
    {
        $this->cicloId = null;
        $this->carreraId = null;
        $this->cicloCurricular = null;
    }

    public function volverACarreras(): void
    {
        $this->carreraId = null;
        $this->cicloCurricular = null;
    }

    public function volverACiclos(): void
    {
        $this->cicloCurricular = null;
    }

    public function with(CursoVirtualService $service): array
    {
        $user = Auth::user();

        // hasPermissionTo() no basta: Dirección tiene este permiso vía '*'
        // sin ser realmente docente, y quedaría viendo "sus" cursos (ninguno)
        // en vez de la vista de supervisión.
        if ($user->hasPermissionTo('aula_virtual.gestionar_propio') && $user->hasRole(RolEnum::DOCENTE->value)) {
            $cursos = $service->delDocente($user->id);
            $rol = 'docente';
        } elseif ($user->hasPermissionTo('aula_virtual.ver_propio') && $user->estudiante) {
            $cursos = $service->delEstudiante($user->estudiante);
            $rol = 'estudiante';
        } else {
            $cursos = $service->todos();
            $rol = 'supervisor';
        }

        $gruposDisponibles = $cursos->pluck('horario.ciclo')->unique('id')->sortByDesc('fecha_inicio')->values();

        $carrerasDisponibles = collect();
        $ciclosCurricularesDisponibles = collect();
        $grupos = collect();

        if ($this->cicloId) {
            $delCiclo = $cursos->filter(fn ($curso) => $curso->horario->ciclo_id === $this->cicloId);
            $carrerasDisponibles = $delCiclo->pluck('horario.carrera')->unique('id')->sortBy('name')->values();

            if ($this->carreraId) {
                $delCarrera = $delCiclo->filter(fn ($curso) => $curso->horario->carrera_id === $this->carreraId);
                $ciclosCurricularesDisponibles = $delCarrera->pluck('horario.ciclo_curricular')->unique()->sort()->values();

                if ($this->cicloCurricular) {
                    $delCicloCurricular = $delCarrera->filter(fn ($curso) => $curso->horario->ciclo_curricular === $this->cicloCurricular);

                    // Un mismo curso+ciclo normalmente tiene un único Horario y
                    // por lo tanto un único CursoVirtual, pero se agrupan por
                    // curso por si dos docentes llegaran a dictarlo en
                    // paralelo: quien mira elegiría cuál quiere ver en vez de
                    // toparse con dos tarjetas casi idénticas sin ninguna
                    // pista de cuál es cuál.
                    $grupos = $delCicloCurricular->groupBy(fn ($curso) => $curso->horario->curso_id);
                }
            }
        }

        return [
            'gruposDisponibles' => $gruposDisponibles,
            'carrerasDisponibles' => $carrerasDisponibles,
            'ciclosCurricularesDisponibles' => $ciclosCurricularesDisponibles,
            'grupos' => $grupos,
            'rol' => $rol,
        ];
    }
}; ?>

<div>
    <x-slot name="header">
        <h1 class="font-display text-2xl text-ink">Aula Virtual</h1>
        <p class="mt-1 text-sm text-ink-dim">
            @if ($rol === 'docente')
                Tus cursos asignados este ciclo.
            @elseif ($rol === 'estudiante')
                Los cursos donde estás matriculado.
            @else
                Todos los cursos virtuales activos.
            @endif
        </p>
    </x-slot>

    @if (! $cicloId)
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($gruposDisponibles as $grupo)
                <button
                    type="button"
                    wire:click="seleccionarGrupo({{ $grupo->id }})"
                    class="block rounded-2xl border border-border bg-surface shadow-sm p-4 text-left transition hover:border-accent"
                >
                    <p class="font-display text-lg text-ink">{{ $grupo->nombre }}</p>
                    <p class="mt-1 text-sm text-ink-dim">{{ $grupo->fecha_inicio->format('d/m/Y') }} – {{ $grupo->fecha_fin->format('d/m/Y') }}</p>
                </button>
            @empty
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">
                    @if ($rol === 'docente')
                        Todavía no tienes cursos con aula virtual activada.
                    @elseif ($rol === 'estudiante')
                        Todavía no hay cursos virtuales para tu matrícula actual.
                    @else
                        No hay cursos virtuales activos.
                    @endif
                </p>
            @endforelse
        </div>
    @elseif (! $carreraId)
        <button type="button" wire:click="volverAGrupos" class="mb-4 text-sm text-ink-faint hover:text-ink">← Grupos</button>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            @forelse ($carrerasDisponibles as $carrera)
                <button
                    type="button"
                    wire:click="seleccionarCarrera({{ $carrera->id }})"
                    class="block rounded-2xl border border-border bg-surface shadow-sm p-6 text-center transition hover:border-accent"
                >
                    <p class="font-display text-lg text-ink">{{ $carrera->name }}</p>
                </button>
            @empty
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">Sin cursos en este grupo.</p>
            @endforelse
        </div>
    @elseif (! $cicloCurricular)
        <button type="button" wire:click="volverACarreras" class="mb-4 text-sm text-ink-faint hover:text-ink">← Carreras</button>

        <div class="grid grid-cols-2 gap-4">
            @forelse ($ciclosCurricularesDisponibles as $ciclo)
                <button
                    type="button"
                    wire:click="seleccionarCicloCurricular({{ $ciclo }})"
                    class="block rounded-2xl border border-border bg-surface shadow-sm p-6 text-center transition hover:border-accent"
                >
                    <p class="font-display text-lg text-ink">Ciclo {{ $ciclo }}</p>
                </button>
            @empty
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">Esta carrera no tiene cursos virtuales en este grupo.</p>
            @endforelse
        </div>
    @else
        <button type="button" wire:click="volverACiclos" class="mb-4 text-sm text-ink-faint hover:text-ink">← Ciclos</button>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($grupos as $grupo)
                @php $primero = $grupo->first(); @endphp
                @if ($grupo->count() === 1)
                    <a
                        href="{{ route('aula-virtual.show', $primero) }}"
                        wire:navigate
                        class="block rounded-2xl border border-border bg-surface shadow-sm p-4 transition hover:border-accent"
                    >
                        <x-curso-portada :curso="$primero->horario->curso" class="mb-3" />
                        <p class="font-display text-lg text-ink">{{ $primero->horario->curso->nombre }}</p>
                        <p class="mt-3 text-xs text-ink-faint">
                            @if ($rol !== 'docente')
                                {{ $primero->horario->docente->name }} ·
                            @endif
                            {{ $primero->horario->diasResumen() }}
                        </p>
                    </a>
                @else
                    <div class="rounded-2xl border border-border bg-surface shadow-sm p-4">
                        <x-curso-portada :curso="$primero->horario->curso" class="mb-3" />
                        <p class="font-display text-lg text-ink">{{ $primero->horario->curso->nombre }}</p>

                        <p class="mt-3 text-xs text-ink-faint">Selecciona un curso virtual</p>
                        <div class="mt-2 flex flex-wrap gap-2">
                            @foreach ($grupo->sortBy(fn ($opcion) => $opcion->horario->docente->name) as $opcion)
                                <a
                                    href="{{ route('aula-virtual.show', $opcion) }}"
                                    wire:navigate
                                    class="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
                                >
                                    {{ $opcion->horario->docente->name }}
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endif
            @empty
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">Este ciclo no tiene cursos virtuales en este grupo.</p>
            @endforelse
        </div>
    @endif
</div>
