<?php

use App\Models\User;
use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Aula;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Services\HorarioService;
use App\Modules\AulaVirtual\Services\CursoVirtualService;
use App\Shared\Enums\RolEnum;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public ?int $cicloId = null;

    public ?int $carreraId = null;

    public ?int $cicloCurricular = null;

    public bool $mostrarModalCurso = false;

    public string $cursoIdNuevo = '';

    public string $docenteIdNuevo = '';

    public string $aulaIdNuevo = '';

    /** @var list<string> */
    public array $diasSeleccionadosNuevo = [];

    /** @var array<string, string> */
    public array $horaInicioHoraPorDia = [];

    /** @var array<string, string> */
    public array $horaInicioMinutoPorDia = [];

    /** @var array<string, string> */
    public array $horaFinHoraPorDia = [];

    /** @var array<string, string> */
    public array $horaFinMinutoPorDia = [];

    public function mount(): void
    {
        $user = Auth::user();

        abort_unless(
            $user->hasAnyPermission(['aula_virtual.ver', 'aula_virtual.gestionar_propio', 'aula_virtual.ver_propio']),
            403,
        );

    }

    /**
     * @return array<string, string>
     */
    public function horasDisponibles(): array
    {
        return collect(range(0, 23))->mapWithKeys(fn (int $hora) => [sprintf('%02d', $hora) => sprintf('%02d', $hora)])->all();
    }

    /**
     * @return array<string, string>
     */
    public function minutosDisponibles(): array
    {
        return ['00' => '00', '15' => '15', '30' => '30', '45' => '45'];
    }

    /**
     * @return list<DiaSemanaEnum>
     */
    private function diasEfectivosNuevo(): array
    {
        return array_map(fn (string $valor) => DiaSemanaEnum::from($valor), $this->diasSeleccionadosNuevo);
    }

    /**
     * Abre el formulario para crear el curso que todavía falta en este
     * ciclo/carrera/ciclo curricular -- mismo academico.gestionar que exige
     * Horarios, porque crea exactamente lo mismo (un Horario) por debajo.
     */
    public function abrirModalCurso(): void
    {
        Gate::authorize('academico.gestionar');

        $this->resetValidation();
        $this->reset([
            'cursoIdNuevo', 'docenteIdNuevo', 'aulaIdNuevo', 'diasSeleccionadosNuevo',
            'horaInicioHoraPorDia', 'horaInicioMinutoPorDia', 'horaFinHoraPorDia', 'horaFinMinutoPorDia',
        ]);
        $this->mostrarModalCurso = true;
    }

    /**
     * Crea el Horario del curso elegido -- HorarioService::crear() activa
     * el aula virtual automáticamente, así que el curso aparece de
     * inmediato en esta misma grilla, sin ningún paso aparte.
     */
    public function guardarCurso(HorarioService $service): void
    {
        Gate::authorize('academico.gestionar');

        $dias = $this->diasEfectivosNuevo();

        $reglas = [
            'cursoIdNuevo' => 'required|integer|exists:cursos,id',
            'docenteIdNuevo' => 'required|integer|exists:users,id',
            'aulaIdNuevo' => 'required|integer|exists:aulas,id',
            'diasSeleccionadosNuevo' => 'required|array|min:1',
            'diasSeleccionadosNuevo.*' => 'string|in:'.implode(',', array_map(fn (DiaSemanaEnum $dia) => $dia->value, DiaSemanaEnum::cases())),
        ];

        foreach ($dias as $dia) {
            $reglas["horaInicioHoraPorDia.{$dia->value}"] = 'required|string|in:'.implode(',', array_keys($this->horasDisponibles()));
            $reglas["horaInicioMinutoPorDia.{$dia->value}"] = 'required|string|in:'.implode(',', array_keys($this->minutosDisponibles()));
            $reglas["horaFinHoraPorDia.{$dia->value}"] = 'required|string|in:'.implode(',', array_keys($this->horasDisponibles()));
            $reglas["horaFinMinutoPorDia.{$dia->value}"] = 'required|string|in:'.implode(',', array_keys($this->minutosDisponibles()));
        }

        $this->validate($reglas);

        $diasParaGuardar = array_map(fn (DiaSemanaEnum $dia) => [
            'dia_semana' => $dia,
            'hora_inicio' => "{$this->horaInicioHoraPorDia[$dia->value]}:{$this->horaInicioMinutoPorDia[$dia->value]}:00",
            'hora_fin' => "{$this->horaFinHoraPorDia[$dia->value]}:{$this->horaFinMinutoPorDia[$dia->value]}:00",
        ], $dias);

        $service->crear([
            'curso_id' => (int) $this->cursoIdNuevo,
            'docente_id' => (int) $this->docenteIdNuevo,
            'aula_id' => (int) $this->aulaIdNuevo,
            'ciclo_id' => $this->cicloId,
            'dias' => $diasParaGuardar,
        ]);

        $this->mostrarModalCurso = false;
        session()->flash('status', 'Curso agregado al aula virtual.');
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

        $cursosFaltantes = collect();
        if ($this->cicloId && $this->carreraId && $this->cicloCurricular && $user->hasPermissionTo('academico.gestionar')) {
            $cursosFaltantes = Curso::query()
                ->where('carrera_id', $this->carreraId)
                ->where('ciclo_curricular', $this->cicloCurricular)
                ->where('activo', true)
                ->whereNotIn('id', $grupos->keys())
                ->orderBy('nombre')
                ->get();
        }

        return [
            'gruposDisponibles' => $gruposDisponibles,
            'carrerasDisponibles' => $carrerasDisponibles,
            'ciclosCurricularesDisponibles' => $ciclosCurricularesDisponibles,
            'grupos' => $grupos,
            'cursosFaltantes' => $cursosFaltantes,
            'docentes' => User::role('docente')->orderBy('name')->get(),
            'aulas' => Aula::query()->where('activa', true)->orderBy('nombre')->get(),
            'horas' => $this->horasDisponibles(),
            'minutos' => $this->minutosDisponibles(),
            'diasSemana' => DiaSemanaEnum::ordenSemana(),
            'diasParaHorasNuevo' => $this->diasEfectivosNuevo(),
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
        <button type="button" wire:click="volverAGrupos" class="mb-4 text-sm text-ink-faint hover:text-ink">← Ciclos</button>

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
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">Sin cursos en este ciclo.</p>
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
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">Esta carrera no tiene cursos virtuales en este ciclo.</p>
            @endforelse
        </div>
    @else
        <div class="mb-4 flex items-center justify-between">
            <button type="button" wire:click="volverACiclos" class="text-sm text-ink-faint hover:text-ink">← Ciclos</button>

            @can('academico.gestionar')
                @if ($cursosFaltantes->isNotEmpty())
                    <x-primary-button type="button" wire:click="abrirModalCurso" class="gap-2">
                        <x-heroicon-o-plus class="h-4 w-4" />
                        Añadir curso
                    </x-primary-button>
                @endif
            @endcan
        </div>

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
                <p class="col-span-full py-8 text-center text-sm text-ink-faint">
                    Este ciclo no tiene cursos virtuales en este ciclo curricular.
                    @can('academico.gestionar')
                        @if ($cursosFaltantes->isNotEmpty())
                            Usa "Añadir curso" arriba para agregar uno.
                        @endif
                    @endcan
                </p>
            @endforelse
        </div>

        {{--
            El modal (y sus tres selects) vive deliberadamente DENTRO de
            este @else, no después del @endif: si se renderizara siempre
            (oculto nada más por x-show), Alpine inicializaría su x-data la
            PRIMERA vez que el DOM lo procesa -- en los pasos anteriores del
            desglose (ciclo/carrera), donde $cursosFaltantes todavía está
            vacío -- y nunca vuelve a leer los datos reales que llegan
            después: Alpine solo evalúa x-data una vez por elemento: aunque
            Livewire actualice el atributo x-data en el HTML con las
            opciones correctas en renders posteriores, el estado interno ya
            inicializado de Alpine (su "opciones" reactivo) se queda
            congelado con el arreglo vacío original, y el <select> de Curso
            queda inservible (no se puede elegir nada) aunque se vea bien.
            Que el modal nazca aquí garantiza que su primera inicialización
            ya ocurra con $cursosFaltantes ya resuelto.
        --}}
        <div
            x-show="$wire.mostrarModalCurso"
        x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
        wire:click.self="$set('mostrarModalCurso', false)"
        x-transition:enter="ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
    >
        <div
            x-show="$wire.mostrarModalCurso"
            class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg"
            x-transition:enter="ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave="ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
            <h2 class="font-display text-lg text-ink">Añadir curso al aula virtual</h2>
            <p class="mt-1 text-xs text-ink-faint">Solo se listan los cursos del plan de estudios que todavía no tienen horario en este ciclo.</p>

            <form wire:submit="guardarCurso" class="mt-4 space-y-4">
                <div>
                    <x-input-label for="cursoIdNuevo" value="Curso" />
                    <x-select-input
                        wire:model="cursoIdNuevo"
                        id="cursoIdNuevo"
                        class="mt-1 block w-full"
                        :options="collect($cursosFaltantes)->mapWithKeys(fn ($curso) => [$curso->id => $curso->nombre])"
                    />
                    <x-input-error :messages="$errors->get('cursoIdNuevo')" class="mt-1" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <x-input-label for="docenteIdNuevo" value="Docente" />
                        <x-select-input
                            wire:model="docenteIdNuevo"
                            id="docenteIdNuevo"
                            class="mt-1 block w-full"
                            :options="collect($docentes)->mapWithKeys(fn ($docente) => [$docente->id => $docente->name])"
                        />
                        <x-input-error :messages="$errors->get('docenteIdNuevo')" class="mt-1" />
                    </div>
                    <div>
                        <x-input-label for="aulaIdNuevo" value="Aula" />
                        <x-select-input
                            wire:model="aulaIdNuevo"
                            id="aulaIdNuevo"
                            class="mt-1 block w-full"
                            :options="collect($aulas)->mapWithKeys(fn ($aula) => [$aula->id => $aula->nombre])"
                        />
                        <x-input-error :messages="$errors->get('aulaIdNuevo')" class="mt-1" />
                    </div>
                </div>

                <div>
                    <x-input-label value="Días de clase" />
                    <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        @foreach ($diasSemana as $dia)
                            <label class="flex items-center gap-2 rounded-md border border-border p-2 text-sm text-ink">
                                <input
                                    type="checkbox"
                                    value="{{ $dia->value }}"
                                    wire:model.live="diasSeleccionadosNuevo"
                                    class="rounded border-border text-accent focus:ring-accent"
                                >
                                {{ $dia->label() }}
                            </label>
                        @endforeach
                    </div>
                    <x-input-error :messages="$errors->get('diasSeleccionadosNuevo')" class="mt-1" />
                </div>

                @if ($diasParaHorasNuevo !== [])
                    <div class="space-y-3" wire:key="horas-nuevo-{{ implode('-', array_map(fn ($d) => $d->value, $diasParaHorasNuevo)) }}">
                        @foreach ($diasParaHorasNuevo as $dia)
                            <div class="rounded-md border border-border p-3">
                                <p class="mb-2 text-sm font-medium text-ink">{{ $dia->label() }}</p>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <x-input-label value="Hora inicio" />
                                        <div class="mt-1 grid grid-cols-2 gap-2">
                                            <x-select-input wire:model="horaInicioHoraPorDia.{{ $dia->value }}" placeholder="Hora" :options="$horas" />
                                            <x-select-input wire:model="horaInicioMinutoPorDia.{{ $dia->value }}" placeholder="Min" :options="$minutos" />
                                        </div>
                                        <x-input-error :messages="$errors->get('horaInicioHoraPorDia.'.$dia->value)" class="mt-1" />
                                        <x-input-error :messages="$errors->get('horaInicioMinutoPorDia.'.$dia->value)" class="mt-1" />
                                    </div>
                                    <div>
                                        <x-input-label value="Hora fin" />
                                        <div class="mt-1 grid grid-cols-2 gap-2">
                                            <x-select-input wire:model="horaFinHoraPorDia.{{ $dia->value }}" placeholder="Hora" :options="$horas" />
                                            <x-select-input wire:model="horaFinMinutoPorDia.{{ $dia->value }}" placeholder="Min" :options="$minutos" />
                                        </div>
                                        <x-input-error :messages="$errors->get('horaFinHoraPorDia.'.$dia->value)" class="mt-1" />
                                        <x-input-error :messages="$errors->get('horaFinMinutoPorDia.'.$dia->value)" class="mt-1" />
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif

                {{-- Los choques de aula/docente los valida HorarioService::crear(), que lanza sus errores bajo la clave "dias". --}}
                <x-input-error :messages="$errors->get('dias')" class="mt-1" />

                <div class="flex justify-end gap-3 pt-2">
                    <x-secondary-button type="button" wire:click="$set('mostrarModalCurso', false)">Cancelar</x-secondary-button>
                    <x-primary-button type="submit">Añadir curso</x-primary-button>
                </div>
            </form>
        </div>
    </div>
    @endif
</div>
