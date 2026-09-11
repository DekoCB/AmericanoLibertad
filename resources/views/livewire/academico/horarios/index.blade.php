<?php

use App\Models\User;
use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Aula;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\HorarioDia;
use App\Modules\Academico\Services\HorarioService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.app')] class extends Component
{
    public string $vista = 'lista';

    public bool $mostrarModal = false;

    public string $cicloFiltro = '';

    // Null mientras se crea uno nuevo; con valor, el modal edita ese horario.
    public ?int $editandoId = null;

    public string $cursoId = '';

    public string $docenteId = '';

    public string $aulaId = '';

    public string $cicloId = '';

    /**
     * Los días de clase elegidos, tanto al crear como al editar: cualquier
     * combinación libre de los 7 días de la semana (ver DiaSemanaEnum) --
     * ya no hay una restricción a franjas institucionales fijas.
     *
     * @var list<string>
     */
    public array $diasSeleccionados = [];

    /** @var array<string, string> */
    public array $horaInicioHoraPorDia = [];

    /** @var array<string, string> */
    public array $horaInicioMinutoPorDia = [];

    /** @var array<string, string> */
    public array $horaFinHoraPorDia = [];

    /** @var array<string, string> */
    public array $horaFinMinutoPorDia = [];

    /**
     * @return array<string, string>
     */
    public function horasDisponibles(): array
    {
        return collect(range(0, 23))->mapWithKeys(fn (int $hora) => [sprintf('%02d', $hora) => sprintf('%02d', $hora)])->all();
    }

    /**
     * Minutos en pasos de 15: los horarios de la institución siempre caen en
     * una hora exacta o cuarto, y un selector de 60 opciones sería incómodo.
     *
     * @return array<string, string>
     */
    public function minutosDisponibles(): array
    {
        return ['00' => '00', '15' => '15', '30' => '30', '45' => '45'];
    }

    public function mount(): void
    {
        Gate::authorize('academico.ver');

        $activo = Ciclo::query()->where('estado', 'activo')->first();
        $this->cicloFiltro = $activo ? (string) $activo->id : '';
    }

    public function abrirModal(): void
    {
        Gate::authorize('academico.gestionar');

        $this->resetValidation();
        $this->reset([
            'editandoId', 'cursoId', 'docenteId', 'aulaId', 'diasSeleccionados',
            'horaInicioHoraPorDia', 'horaInicioMinutoPorDia', 'horaFinHoraPorDia', 'horaFinMinutoPorDia',
        ]);
        $this->cicloId = $this->cicloFiltro;
        $this->mostrarModal = true;
    }

    /**
     * Precarga el horario elegido (desde la tarjeta en la pestaña
     * "Editar") en el mismo modal que crea uno nuevo, con sus días reales.
     */
    public function abrirModalEditar(int $horarioId): void
    {
        Gate::authorize('academico.gestionar');

        $horario = Horario::query()->with('dias')->findOrFail($horarioId);

        $this->resetValidation();
        $this->editandoId = $horario->id;
        $this->cicloId = (string) $horario->ciclo_id;
        $this->cursoId = (string) $horario->curso_id;
        $this->docenteId = (string) $horario->docente_id;
        $this->aulaId = (string) $horario->aula_id;
        $this->diasSeleccionados = $horario->dias->pluck('dia_semana.value')->all();

        $this->horaInicioHoraPorDia = [];
        $this->horaInicioMinutoPorDia = [];
        $this->horaFinHoraPorDia = [];
        $this->horaFinMinutoPorDia = [];

        foreach ($horario->dias as $dia) {
            [$horaInicio, $minutoInicio] = explode(':', $dia->hora_inicio);
            [$horaFin, $minutoFin] = explode(':', $dia->hora_fin);
            $this->horaInicioHoraPorDia[$dia->dia_semana->value] = $horaInicio;
            $this->horaInicioMinutoPorDia[$dia->dia_semana->value] = $minutoInicio;
            $this->horaFinHoraPorDia[$dia->dia_semana->value] = $horaFin;
            $this->horaFinMinutoPorDia[$dia->dia_semana->value] = $minutoFin;
        }

        $this->mostrarModal = true;
    }

    /**
     * Los días efectivos sobre los que se piden horas y se arma el
     * horario: cualquier combinación libre de los 7 días, tanto al crear
     * como al editar.
     *
     * @return list<DiaSemanaEnum>
     */
    private function diasEfectivos(): array
    {
        return array_map(fn (string $valor) => DiaSemanaEnum::from($valor), $this->diasSeleccionados);
    }

    public function guardar(HorarioService $service): void
    {
        Gate::authorize('academico.gestionar');

        $dias = $this->diasEfectivos();

        $reglas = [
            'cursoId' => 'required|integer|exists:cursos,id',
            'docenteId' => 'required|integer|exists:users,id',
            'aulaId' => 'required|integer|exists:aulas,id',
            'cicloId' => 'required|integer|exists:ciclos,id',
            'diasSeleccionados' => 'required|array|min:1',
            'diasSeleccionados.*' => 'string|in:'.implode(',', array_map(fn (DiaSemanaEnum $dia) => $dia->value, DiaSemanaEnum::cases())),
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

        $datos = [
            'curso_id' => (int) $this->cursoId,
            'docente_id' => (int) $this->docenteId,
            'aula_id' => (int) $this->aulaId,
            'ciclo_id' => (int) $this->cicloId,
            'dias' => $diasParaGuardar,
        ];

        if ($this->editandoId === null) {
            $service->crear($datos);
            session()->flash('status', 'Horario creado correctamente.');
        } else {
            $service->actualizar(Horario::query()->findOrFail($this->editandoId), $datos);
            session()->flash('status', 'Horario actualizado correctamente.');
        }

        $this->mostrarModal = false;
    }

    /**
     * Arrastrar-y-soltar en la pestaña "Editar": mueve un solo día
     * (HorarioDia) al día donde se soltó, conservando su hora. Si choca
     * con otro horario en la misma aula/docente, HorarioService::moverDia()
     * lanza la misma ValidationException que ya usa crear()/actualizar();
     * se muestra como error en vez de mover la tarjeta.
     */
    public function moverDia(int $horarioDiaId, string $nuevoDia, HorarioService $service): void
    {
        Gate::authorize('academico.gestionar');

        $dia = HorarioDia::query()->findOrFail($horarioDiaId);
        $nuevoDiaEnum = DiaSemanaEnum::from($nuevoDia);

        if ($dia->dia_semana === $nuevoDiaEnum) {
            return;
        }

        try {
            $service->moverDia($dia, $nuevoDiaEnum);
            session()->flash('status', 'Horario movido correctamente.');
        } catch (ValidationException $e) {
            $this->addError('dias', $e->validator->errors()->first());
        }
    }

    public function with(HorarioService $service): array
    {
        $horarios = $this->cicloFiltro ? $service->delCiclo((int) $this->cicloFiltro) : collect();

        return [
            'ciclos' => Ciclo::query()->orderByDesc('fecha_inicio')->get(),
            'horariosPorCarrera' => $this->agruparPorCarrera($horarios),
            'horarioDiasPorDia' => $this->agruparDiasParaLaGrilla($horarios),
            'cursos' => Curso::query()->where('activo', true)->orderBy('nombre')->get(),
            'docentes' => User::role('docente')->orderBy('name')->get(),
            'aulas' => Aula::query()->where('activa', true)->orderBy('nombre')->get(),
            'horas' => $this->horasDisponibles(),
            'minutos' => $this->minutosDisponibles(),
            'diasSemana' => DiaSemanaEnum::ordenSemana(),
            'diasParaHoras' => $this->diasEfectivos(),
        ];
    }

    /**
     * La vista organizada por carrera y ciclo -- así se ven de una los
     * horarios de un mismo ciclo de una carrera, en vez de una tabla plana
     * ordenada por curso. Ya no se agrupa primero por franja institucional:
     * los días de un horario ahora son libres, no calzan necesariamente con
     * ninguna franja fija.
     *
     * @param  Collection<int, Horario>  $horarios
     * @return Collection<string, Collection<int, Horario>>
     */
    private function agruparPorCarrera($horarios)
    {
        return $horarios
            ->groupBy(fn (Horario $horario) => $horario->carrera->name.' · Ciclo '.$horario->curso->cicloRomano())
            ->sortKeys();
    }

    /**
     * Los HorarioDia de estos horarios, agrupados por día de la semana --
     * la fuente de datos de la grilla semanal de la pestaña "Editar".
     *
     * @param  Collection<int, Horario>  $horarios
     * @return Collection<string, Collection<int, HorarioDia>>
     */
    private function agruparDiasParaLaGrilla($horarios)
    {
        return $horarios
            ->flatMap(fn (Horario $horario) => $horario->dias)
            ->groupBy(fn (HorarioDia $dia) => $dia->dia_semana->value);
    }
}; ?>

<div>
    <x-slot name="header">
        <h1 class="font-display text-2xl text-ink">Horarios</h1>
        <p class="mt-1 text-sm text-ink-dim">Un aula y un docente no pueden tener dos clases a la misma hora.</p>
    </x-slot>

    {{-- Ver academico/carreras/index.blade.php: el botón no puede vivir en x-slot="header". --}}
    @can('academico.gestionar')
        <div class="mb-4 flex justify-end">
            <x-primary-button type="button" wire:click="abrirModal" class="gap-2">
                <x-heroicon-o-plus class="h-4 w-4" />
                Nuevo horario
            </x-primary-button>
        </div>
    @endcan

    @if (session('status'))
        <x-alert class="mb-4">{{ session('status') }}</x-alert>
    @endif

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <x-select-input
            wire:model.live="cicloFiltro"
            placeholder="Selecciona un ciclo…"
            class="w-full sm:max-w-xs"
            :options="collect($ciclos)->mapWithKeys(fn ($ciclo) => [$ciclo->id => $ciclo->nombre])"
        />

        <div class="flex gap-1 rounded-md border border-border bg-surface p-1">
            <button
                type="button"
                wire:click="$set('vista', 'lista')"
                @class(['rounded px-3 py-1.5 text-sm font-medium', 'bg-accent text-white' => $vista === 'lista', 'text-ink-dim' => $vista !== 'lista'])
            >Lista</button>
            @can('academico.gestionar')
                <button
                    type="button"
                    wire:click="$set('vista', 'editar')"
                    @class(['rounded px-3 py-1.5 text-sm font-medium', 'bg-accent text-white' => $vista === 'editar', 'text-ink-dim' => $vista !== 'editar'])
                >Editar</button>
            @endcan
        </div>
    </div>

    @if ($vista === 'lista')
        @forelse ($horariosPorCarrera as $nombreCarrera => $horariosDeLaCarrera)
            <div class="mb-6">
                <div class="mb-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div class="border-b border-border bg-surface-2 px-4 py-2 font-display text-sm text-ink">{{ $nombreCarrera }}</div>
                    <table class="min-w-full divide-y divide-border text-sm">
                        <thead class="bg-surface-2">
                            <tr>
                                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Curso</th>
                                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Docente</th>
                                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Aula</th>
                                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Horario</th>
                                    <th class="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-border">
                                @foreach ($horariosDeLaCarrera->sortBy(fn ($horario) => $horario->curso->nombre) as $horario)
                                    <tr wire:key="horario-{{ $horario->id }}">
                                        <td class="px-4 py-3 font-medium text-ink">{{ $horario->curso->nombre }}</td>
                                        <td class="px-4 py-3 text-ink-dim">{{ $horario->docente->name }}</td>
                                        <td class="px-4 py-3 text-ink-dim">{{ $horario->aula->nombre }}</td>
                                        <td class="px-4 py-3 font-mono text-ink-dim">{{ $horario->diasResumen() }}</td>
                                        <td class="px-4 py-3 text-right">
                                            @can('academico.gestionar')
                                                <button type="button" wire:click="abrirModalEditar({{ $horario->id }})" class="text-sm font-medium text-accent hover:underline">
                                                    Editar
                                                </button>
                                            @endcan
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
            </div>
        @empty
            <div class="rounded-2xl border border-border bg-surface shadow-sm px-4 py-8 text-center text-sm text-ink-faint">
                {{ $cicloFiltro ? 'Este ciclo no tiene horarios todavía.' : 'Selecciona un ciclo para ver sus horarios.' }}
            </div>
        @endforelse
    @else
        <p class="mb-3 text-xs text-ink-faint">Arrastra una tarjeta a otro día para reprogramarla, o haz clic en ella para editar curso, docente, aula u horas.</p>
        <x-input-error :messages="$errors->get('dias')" class="mb-3" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7" x-data>
            @foreach ($diasSemana as $dia)
                <div
                    wire:key="columna-{{ $dia->value }}"
                    class="min-h-[160px] rounded-2xl border border-border bg-surface p-2"
                    x-on:dragover.prevent
                    x-on:drop.prevent="$wire.moverDia($event.dataTransfer.getData('text/plain'), '{{ $dia->value }}')"
                >
                    <p class="mb-2 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">{{ $dia->label() }}</p>

                    @foreach (($horarioDiasPorDia[$dia->value] ?? []) as $horarioDia)
                        <div
                            wire:key="tarjeta-{{ $horarioDia->id }}"
                            draggable="true"
                            x-on:dragstart="$event.dataTransfer.setData('text/plain', '{{ $horarioDia->id }}')"
                            wire:click="abrirModalEditar({{ $horarioDia->horario_id }})"
                            class="mb-2 cursor-move rounded-lg border border-border bg-surface-2 p-2 text-xs transition hover:border-accent"
                        >
                            <p class="font-medium text-ink">{{ $horarioDia->horario->curso->nombre }}</p>
                            <p class="text-ink-dim">{{ $horarioDia->horario->docente->name }}</p>
                            <p class="text-ink-faint">{{ $horarioDia->horario->carrera->name }} · Ciclo {{ $horarioDia->horario->curso->cicloRomano() }} · {{ substr($horarioDia->hora_inicio, 0, 5) }}–{{ substr($horarioDia->hora_fin, 0, 5) }}</p>
                        </div>
                    @endforeach
                </div>
            @endforeach
        </div>
    @endif

    <div
        x-show="$wire.mostrarModal"
        x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
        wire:click.self="$set('mostrarModal', false)"
        x-transition:enter="ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
    >
        <div
            x-show="$wire.mostrarModal"
            class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg"
            x-transition:enter="ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave="ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
                <h2 class="font-display text-lg text-ink">{{ $editandoId === null ? 'Nuevo horario' : 'Editar horario' }}</h2>

                <form wire:submit="guardar" class="mt-4 space-y-4">
                    <div>
                        <x-input-label for="cicloId" value="Ciclo" />
                        <x-select-input
                            wire:model="cicloId"
                            id="cicloId"
                            class="mt-1 block w-full"
                            :options="collect($ciclos)->mapWithKeys(fn ($ciclo) => [$ciclo->id => $ciclo->nombre])"
                        />
                        <x-input-error :messages="$errors->get('cicloId')" class="mt-1" />
                    </div>

                    <div>
                        <x-input-label for="cursoId" value="Curso" />
                        <x-select-input
                            wire:model.live="cursoId"
                            id="cursoId"
                            class="mt-1 block w-full"
                            :options="collect($cursos)->mapWithKeys(fn ($curso) => [$curso->id => $curso->nombre.' ('.$curso->codigo.')'])"
                        />
                        <x-input-error :messages="$errors->get('cursoId')" class="mt-1" />
                        {{-- Carrera/ciclo curricular ya no se eligen aparte: los deriva Horario del curso elegido (ver Horario::booted()). --}}
                        @php $cursoElegido = $this->cursoId !== '' ? \App\Modules\Academico\Models\Curso::find($this->cursoId) : null; @endphp
                        @if ($cursoElegido?->carrera)
                            <p class="mt-1 text-xs text-ink-faint">{{ $cursoElegido->carrera->name }} · Ciclo {{ $cursoElegido->cicloRomano() }}</p>
                        @endif
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <x-input-label for="docenteId" value="Docente" />
                            <x-select-input
                                wire:model="docenteId"
                                id="docenteId"
                                class="mt-1 block w-full"
                                :options="collect($docentes)->mapWithKeys(fn ($docente) => [$docente->id => $docente->name])"
                            />
                            <x-input-error :messages="$errors->get('docenteId')" class="mt-1" />
                        </div>
                        <div>
                            <x-input-label for="aulaId" value="Aula" />
                            <x-select-input
                                wire:model="aulaId"
                                id="aulaId"
                                class="mt-1 block w-full"
                                :options="collect($aulas)->mapWithKeys(fn ($aula) => [$aula->id => $aula->nombre])"
                            />
                            <x-input-error :messages="$errors->get('aulaId')" class="mt-1" />
                        </div>
                    </div>

                    <div>
                        <x-input-label value="Días de clase" />
                        <p class="mt-1 text-xs text-ink-faint">Elige libremente cualquier combinación de días de la semana.</p>

                        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            @foreach ($diasSemana as $dia)
                                <label class="flex items-center gap-2 rounded-md border border-border p-2 text-sm text-ink">
                                    <input
                                        type="checkbox"
                                        value="{{ $dia->value }}"
                                        wire:model.live="diasSeleccionados"
                                        class="rounded border-border text-accent focus:ring-accent"
                                    >
                                    {{ $dia->label() }}
                                </label>
                            @endforeach
                        </div>

                        <x-input-error :messages="$errors->get('diasSeleccionados')" class="mt-1" />
                    </div>

                    @if ($diasParaHoras !== [])
                        <div class="space-y-3" wire:key="horas-{{ implode('-', array_map(fn ($d) => $d->value, $diasParaHoras)) }}">
                            @foreach ($diasParaHoras as $dia)
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

                    {{-- Los choques de aula/docente los valida HorarioService::crear()/actualizar(), que lanza sus errores bajo la clave "dias". --}}
                    <x-input-error :messages="$errors->get('dias')" class="mt-1" />

                    <div class="flex justify-end gap-3 pt-2">
                        <x-secondary-button type="button" wire:click="$set('mostrarModal', false)">Cancelar</x-secondary-button>
                        <x-primary-button type="submit">{{ $editandoId === null ? 'Crear horario' : 'Guardar cambios' }}</x-primary-button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
