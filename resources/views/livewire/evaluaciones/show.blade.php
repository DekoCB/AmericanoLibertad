<?php

use App\Modules\Academico\Models\Horario;
use App\Modules\AulaVirtual\Models\CursoVirtual;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Evaluaciones\Imports\HojaConEncabezadosImport;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Services\BloqueoAccesoService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;
use Livewire\WithFileUploads;
use Maatwebsite\Excel\Facades\Excel;

new #[Layout('layouts.app')] class extends Component
{
    use WithFileUploads;

    public Horario $horario;

    public string $mitadActual = 'primera';

    public string $modo = 'ver';

    // --- "Ver evaluaciones": grilla de notas de la mitad actual ---

    /** @var array<int, array<int, string>> */
    public array $notas = [];

    public bool $guardado = false;

    public string $columnaImportar = '';

    public $archivoNotas = null;

    /** @var array{exitosos: int, errores: list<array{fila: int, mensaje: string}>}|null */
    public ?array $resultadoImportacion = null;

    // --- Fechas/enlace del examen de la mitad actual ---

    public string $fechaExamen = '';

    public string $enlaceExamen = '';

    public string $disponibleHastaExamen = '';

    // --- "Crear evaluación": nueva Continua (o edición de una existente) ---

    public ?int $continuaEditandoId = null;

    public string $nuevoNombre = '';

    public string $nuevaFecha = '';

    public string $nuevoEnlace = '';

    public string $nuevoDisponibleHasta = '';

    // --- Comportamiento (AA) ---

    /** @var array<int, string> */
    public array $comportamiento = [];

    public bool $guardadoComportamiento = false;

    public function mount(Horario $horario, EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.ver-horario', $horario);

        $this->horario = $horario;
        $this->nuevaFecha = now()->format('Y-m-d');

        if (Gate::allows('evaluaciones.registrar-horario', $horario) || Auth::user()->hasPermissionTo('evaluaciones.ver')) {
            $service->sembrarExamenes($horario);
            $this->cargarMitad($service);
            $this->cargarComportamiento($service);
        }
    }

    public function cambiarMitad(string $mitad, EvaluacionService $service): void
    {
        $this->mitadActual = $mitad;
        $this->guardado = false;
        $this->resultadoImportacion = null;
        $this->cargarMitad($service);
    }

    public function irACrear(): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);
        $this->continuaEditandoId = null;
        $this->reset(['nuevoNombre', 'nuevoEnlace', 'nuevoDisponibleHasta']);
        $this->nuevaFecha = now()->format('Y-m-d');
        $this->modo = 'crear';
    }

    /**
     * Abre el mismo formulario de "Crear evaluación" pero precargado con
     * los datos de una Continua existente -- al guardar, actualiza en vez
     * de crear una nueva (ver guardarContinua()).
     */
    public function editarContinua(int $evaluacionId): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $continua = Evaluacion::query()
            ->where('horario_id', $this->horario->id)
            ->where('tipo', TipoEvaluacionEnum::CONTINUA)
            ->findOrFail($evaluacionId);

        $this->continuaEditandoId = $continua->id;
        $this->nuevoNombre = (string) $continua->nombre;
        $this->nuevaFecha = $continua->fecha?->format('Y-m-d') ?? now()->format('Y-m-d');
        $this->nuevoEnlace = (string) $continua->enlace_externo;
        $this->nuevoDisponibleHasta = $continua->disponible_hasta?->format('Y-m-d\TH:i') ?? '';
        $this->modo = 'crear';
    }

    public function eliminarContinua(int $evaluacionId, EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $continua = Evaluacion::query()
            ->where('horario_id', $this->horario->id)
            ->where('tipo', TipoEvaluacionEnum::CONTINUA)
            ->findOrFail($evaluacionId);

        $service->eliminarContinua($continua);
        $this->cargarMitad($service);
    }

    public function irAVer(EvaluacionService $service): void
    {
        $this->modo = 'ver';
        $this->continuaEditandoId = null;
        $this->reset(['nuevoNombre', 'nuevoEnlace', 'nuevoDisponibleHasta']);
        $this->nuevaFecha = now()->format('Y-m-d');
        $this->cargarMitad($service);
    }

    private function cargarMitad(EvaluacionService $service): void
    {
        abort_unless(
            Gate::allows('evaluaciones.registrar-horario', $this->horario) || Auth::user()->hasPermissionTo('evaluaciones.ver'),
            403,
        );

        $mitad = MitadCicloEnum::from($this->mitadActual);
        $estudiantes = $service->estudiantesDelHorario($this->horario);
        $continuas = $service->continuasDeLaMitad($this->horario, $mitad);
        $examen = $service->examenDeLaMitad($this->horario, $mitad);

        $this->fechaExamen = $examen?->fecha?->format('Y-m-d') ?? '';
        $this->enlaceExamen = (string) $examen?->enlace_externo;
        $this->disponibleHastaExamen = $examen?->disponible_hasta?->format('Y-m-d\TH:i') ?? '';

        $columnas = $continuas->when($examen, fn ($c) => $c->push($examen));
        $this->columnaImportar = (string) $columnas->first()?->id;

        foreach ($estudiantes as $estudiante) {
            $this->notas[$estudiante->id] = [];

            foreach ($columnas as $columna) {
                $calificacion = $service->calificacionesDe($columna)->get($estudiante->id);
                $this->notas[$estudiante->id][$columna->id] = $calificacion ? (string) $calificacion->nota_numerica : '';
            }
        }
    }

    private function cargarComportamiento(EvaluacionService $service): void
    {
        $comportamientos = $service->comportamientosDelHorario($this->horario);

        foreach ($service->estudiantesDelHorario($this->horario) as $estudiante) {
            $existente = $comportamientos->get($estudiante->id);
            $this->comportamiento[$estudiante->id] = $existente ? (string) $existente->nota_numerica : '';
        }
    }

    public function guardarContinua(EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $this->validate([
            'nuevaFecha' => 'required|date',
            'nuevoNombre' => 'nullable|string|max:150',
            'nuevoEnlace' => 'nullable|url|max:500',
            'nuevoDisponibleHasta' => 'nullable|date',
        ]);

        if ($this->continuaEditandoId) {
            $continua = Evaluacion::query()
                ->where('horario_id', $this->horario->id)
                ->where('tipo', TipoEvaluacionEnum::CONTINUA)
                ->findOrFail($this->continuaEditandoId);

            $service->actualizarContinua(
                $continua,
                $this->nuevoNombre ?: null,
                $this->nuevaFecha,
                $this->nuevoEnlace ?: null,
                $this->nuevoDisponibleHasta ?: null,
            );
        } else {
            $service->crearContinua(
                $this->horario,
                MitadCicloEnum::from($this->mitadActual),
                $this->nuevoNombre ?: null,
                $this->nuevaFecha,
                $this->nuevoEnlace ?: null,
                $this->nuevoDisponibleHasta ?: null,
            );
        }

        $this->irAVer($service);
    }

    public function guardarFechaExamen(EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $this->validate([
            'fechaExamen' => 'nullable|date',
            'enlaceExamen' => 'nullable|url|max:500',
            'disponibleHastaExamen' => 'nullable|date',
        ]);

        $examen = $service->examenDeLaMitad($this->horario, MitadCicloEnum::from($this->mitadActual));
        abort_unless($examen, 404);

        $service->actualizarFecha($examen, $this->fechaExamen ?: null);
        $service->actualizarEnlace($examen, $this->enlaceExamen ?: null, $this->disponibleHastaExamen ?: null);
    }

    public function guardarNotas(EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $rules = [];
        foreach ($this->notas as $estudianteId => $porColumna) {
            foreach (array_keys($porColumna) as $columnaId) {
                $rules["notas.{$estudianteId}.{$columnaId}"] = 'nullable|numeric|min:0|max:20';
            }
        }
        $this->validate($rules);

        $columnas = Evaluacion::query()->where('horario_id', $this->horario->id)->get()->keyBy('id');
        $estudiantes = $service->estudiantesDelHorario($this->horario)->keyBy('id');

        foreach ($this->notas as $estudianteId => $porColumna) {
            $estudiante = $estudiantes->get($estudianteId);

            if (! $estudiante) {
                continue;
            }

            foreach ($porColumna as $columnaId => $nota) {
                if ($nota === '' || $nota === null) {
                    continue;
                }

                $columna = $columnas->get((int) $columnaId);

                if (! $columna) {
                    continue;
                }

                $service->calificar(
                    $columna,
                    $estudiante,
                    (float) $nota,
                    null,
                    Auth::id(),
                );
            }
        }

        $this->guardado = true;
    }

    public function guardarComportamiento(EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $this->validate(['comportamiento.*' => 'nullable|numeric|min:0|max:20']);

        $estudiantes = $service->estudiantesDelHorario($this->horario)->keyBy('id');

        foreach ($this->comportamiento as $estudianteId => $nota) {
            if ($nota === '' || $nota === null) {
                continue;
            }

            $estudiante = $estudiantes->get($estudianteId);

            if (! $estudiante) {
                continue;
            }

            $service->registrarComportamiento($this->horario, $estudiante, (float) $nota, Auth::id());
        }

        $this->guardadoComportamiento = true;
    }

    /**
     * Importa notas desde un CSV/Excel (típicamente exportado de un Google
     * Forms al que se le agregó una pregunta de DNI) hacia la columna
     * elegida en $columnaImportar: columnas "dni" y "nota" obligatorias,
     * "observaciones" opcional. Reutiliza el mismo permiso que el registro
     * manual de notas.
     */
    public function importarNotas(EvaluacionService $service): void
    {
        Gate::authorize('evaluaciones.registrar-horario', $this->horario);

        $this->validate([
            'archivoNotas' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:2048'],
            'columnaImportar' => ['required', 'integer'],
        ]);

        $evaluacion = Evaluacion::query()
            ->where('horario_id', $this->horario->id)
            ->where('mitad', $this->mitadActual)
            ->find($this->columnaImportar);

        abort_unless($evaluacion, 404);

        $import = new HojaConEncabezadosImport;
        Excel::import($import, $this->archivoNotas);

        $this->resultadoImportacion = $service->calificarDesdeFilas($evaluacion, $import->filas, Auth::id());
        $this->reset('archivoNotas');
        $this->cargarMitad($service);
    }

    public function publicarMitad(EvaluacionService $service): void
    {
        abort_unless(Auth::user()->hasPermissionTo('evaluaciones.publicar'), 403);

        $service->publicarMitad($this->horario, MitadCicloEnum::from($this->mitadActual));
        $this->cargarMitad($service);
    }

    public function with(EvaluacionService $service, BloqueoAccesoService $bloqueos): array
    {
        $user = Auth::user();
        $puedeRegistrar = Gate::allows('evaluaciones.registrar-horario', $this->horario);
        $puedeSupervisar = ! $puedeRegistrar && $user->hasPermissionTo('evaluaciones.ver');
        $puedePublicar = $user->hasPermissionTo('evaluaciones.publicar');

        // Para el enlace "← Volver al curso": cada Horario tiene siempre un
        // CursoVirtual (HorarioService::crear() lo activa automáticamente),
        // así que esto nunca debería ser null en uso real -- pero un
        // Horario de prueba creado directo con el factory (sin pasar por el
        // servicio) sí podría no tenerlo.
        $cursoVirtual = CursoVirtual::query()->where('horario_id', $this->horario->id)->first();

        if ($puedeRegistrar || $puedeSupervisar) {
            $mitad = MitadCicloEnum::from($this->mitadActual);
            $estudiantes = $service->estudiantesDelHorario($this->horario);
            $continuas = $service->continuasDeLaMitad($this->horario, $mitad);
            $examen = $service->examenDeLaMitad($this->horario, $mitad);
            $columnas = (clone $continuas)->when($examen, fn ($c) => $c->push($examen));

            $promedios = $estudiantes->mapWithKeys(fn (Estudiante $estudiante) => [
                $estudiante->id => $service->promedioMitad($estudiante, $this->horario, $mitad),
            ]);

            $promediosFinales = $estudiantes->mapWithKeys(fn (Estudiante $estudiante) => [
                $estudiante->id => $service->promedioFinalDelEstudiante($estudiante, $this->horario),
            ]);

            return [
                'puedeRegistrar' => $puedeRegistrar,
                'puedeSupervisar' => $puedeSupervisar,
                'puedePublicar' => $puedePublicar,
                'estudiantes' => $estudiantes,
                'continuas' => $continuas,
                'examen' => $examen,
                'columnas' => $columnas,
                'promedios' => $promedios,
                'promediosFinales' => $promediosFinales,
                'resumenMitades' => null,
                'promedioFinal' => null,
                'comportamientoPropio' => null,
                'evaluacionesConEnlace' => collect(),
                'cursoVirtual' => $cursoVirtual,
            ];
        }

        $resumenMitades = null;
        $promedioFinal = null;
        $comportamientoPropio = null;
        $evaluacionesConEnlace = collect();
        $estaBloqueado = false;

        if ($user->estudiante) {
            $estaBloqueado = $bloqueos->estaBloqueado($user->estudiante)
                || $bloqueos->tieneCuotasVencidasEnCicloActual($user->estudiante);

            if (! $estaBloqueado) {
                $resumenMitades = $service->resumenMitadesDelEstudiante($user->estudiante, $this->horario);
                $promedioFinal = $service->promedioFinalDelEstudiante($user->estudiante, $this->horario, soloPublicadas: true);
                $comportamiento = $service->comportamientoDelEstudiante($this->horario, $user->estudiante);
                $comportamientoPropio = $comportamiento?->nota_numerica !== null ? (float) $comportamiento->nota_numerica : null;
                $evaluacionesConEnlace = $service->evaluacionesConEnlaceDelHorario($this->horario);
            }
        }

        return [
            'puedeRegistrar' => false,
            'puedeSupervisar' => false,
            'puedePublicar' => false,
            'estudiantes' => collect(),
            'continuas' => collect(),
            'examen' => null,
            'columnas' => collect(),
            'promedios' => collect(),
            'promediosFinales' => collect(),
            'resumenMitades' => $resumenMitades,
            'promedioFinal' => $promedioFinal,
            'comportamientoPropio' => $comportamientoPropio,
            'evaluacionesConEnlace' => $evaluacionesConEnlace,
            'miEstudianteId' => $user->estudiante?->id,
            'estaBloqueado' => $estaBloqueado,
            'cursoVirtual' => $cursoVirtual,
        ];
    }
}; ?>

<div>
    <x-slot name="header">
        @if ($cursoVirtual)
            <a href="{{ route('aula-virtual.show', $cursoVirtual) }}" wire:navigate class="text-sm text-ink-faint hover:text-ink">← Volver al curso</a>
        @else
            <a href="{{ route('evaluaciones.index') }}" wire:navigate class="text-sm text-ink-faint hover:text-ink">← Evaluaciones</a>
        @endif
        <div class="mt-1 flex items-center gap-2">
            <h1 class="font-display text-2xl text-ink">{{ $horario->curso->nombre }}</h1>
        </div>
        <p class="mt-1 text-sm text-ink-dim">
            {{ $horario->carrera->name }} · Ciclo {{ $horario->ciclo_curricular }} · {{ $horario->ciclo->nombre }} · {{ $horario->docente->name }}
        </p>
    </x-slot>

    @if ($puedeRegistrar || $puedeSupervisar)
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div class="flex items-center gap-1">
                @foreach (['primera' => 'Mitad I', 'segunda' => 'Mitad II'] as $valor => $etiqueta)
                    <button
                        type="button"
                        wire:click="cambiarMitad('{{ $valor }}')"
                        @class([
                            'border-b-2 px-4 py-2 font-display text-sm font-medium transition',
                            'border-accent text-accent' => $mitadActual === $valor,
                            'border-transparent text-ink-faint hover:text-ink' => $mitadActual !== $valor,
                        ])
                    >
                        {{ $etiqueta }}
                    </button>
                @endforeach
            </div>

            @if ($puedeRegistrar)
                <div class="mb-2 flex gap-1 rounded-lg bg-surface-2 p-1">
                    <button type="button" wire:click="irAVer" @class(['rounded-md px-3 py-1.5 text-sm font-medium transition', 'bg-surface text-ink shadow-sm' => $modo === 'ver', 'text-ink-faint hover:text-ink' => $modo !== 'ver'])>
                        Ver evaluaciones
                    </button>
                    <button type="button" wire:click="irACrear" @class(['rounded-md px-3 py-1.5 text-sm font-medium transition', 'bg-surface text-ink shadow-sm' => $modo === 'crear', 'text-ink-faint hover:text-ink' => $modo !== 'crear'])>
                        + Crear evaluación
                    </button>
                </div>
            @endif
        </div>

        @if ($modo === 'crear' && $puedeRegistrar)
            <form wire:submit="guardarContinua" class="max-w-xl space-y-3 rounded-2xl border border-border bg-surface shadow-sm p-4">
                <h3 class="font-display text-sm text-ink">
                    {{ $continuaEditandoId ? 'Editar evaluación continua' : 'Nueva evaluación continua' }} -- Mitad {{ $mitadActual === 'primera' ? 'I' : 'II' }}
                </h3>
                <p class="text-xs text-ink-faint">Cuenta junto a las demás continuas de esta mitad dentro del 60% del promedio. Puedes crear tantas como necesites.</p>
                <div>
                    <x-input-label for="nuevoNombre" value="Nombre (opcional)" />
                    <x-text-input wire:model="nuevoNombre" id="nuevoNombre" class="mt-1 block w-full" placeholder="Se autonumera como C1, C2… si lo dejas vacío" />
                    <x-input-error :messages="$errors->get('nuevoNombre')" class="mt-1" />
                </div>
                <div>
                    <x-input-label for="nuevaFecha" value="Fecha" />
                    <x-date-input wire:model="nuevaFecha" id="nuevaFecha" class="mt-1 block w-full" />
                    <x-input-error :messages="$errors->get('nuevaFecha')" class="mt-1" />
                </div>
                <div>
                    <x-input-label for="nuevoEnlace" value="Enlace externo (opcional)" />
                    <x-text-input wire:model="nuevoEnlace" id="nuevoEnlace" class="mt-1 block w-full" placeholder="https://…" />
                    <x-input-error :messages="$errors->get('nuevoEnlace')" class="mt-1" />
                </div>
                <div>
                    <x-input-label for="nuevoDisponibleHasta" value="Disponible hasta (opcional)" />
                    <x-datetime-input wire:model="nuevoDisponibleHasta" id="nuevoDisponibleHasta" class="mt-1 block w-full" />
                    <x-input-error :messages="$errors->get('nuevoDisponibleHasta')" class="mt-1" />
                </div>
                <div class="flex justify-end gap-2">
                    <x-secondary-button type="button" wire:click="irAVer">Cancelar</x-secondary-button>
                    <x-primary-button type="submit">{{ $continuaEditandoId ? 'Guardar' : 'Crear' }}</x-primary-button>
                </div>
            </form>
        @else
            @if ($puedeRegistrar)
                <div class="mb-4 space-y-3 rounded-2xl border border-border bg-surface shadow-sm p-4">
                    <h3 class="font-display text-sm text-ink">{{ $mitadActual === 'primera' ? 'Examen parcial' : 'Examen final' }}</h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <x-input-label for="fechaExamen" value="Fecha" />
                            <x-date-input wire:model="fechaExamen" id="fechaExamen" class="mt-1 block w-full" />
                            <x-input-error :messages="$errors->get('fechaExamen')" class="mt-1" />
                        </div>
                        <div>
                            <x-input-label for="enlaceExamen" value="Enlace (opcional)" />
                            <x-text-input wire:model="enlaceExamen" id="enlaceExamen" class="mt-1 block w-full" placeholder="https://…" />
                            <x-input-error :messages="$errors->get('enlaceExamen')" class="mt-1" />
                        </div>
                        <div>
                            <x-input-label for="disponibleHastaExamen" value="Disponible hasta (opcional)" />
                            <x-datetime-input wire:model="disponibleHastaExamen" id="disponibleHastaExamen" class="mt-1 block w-full" />
                            <x-input-error :messages="$errors->get('disponibleHastaExamen')" class="mt-1" />
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <x-secondary-button type="button" wire:click="guardarFechaExamen">Guardar</x-secondary-button>
                    </div>
                </div>
            @endif

            @if ($guardado)
                <p class="mb-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">Notas guardadas.</p>
            @endif

            <div class="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                <table class="min-w-full divide-y divide-border text-sm">
                    <thead class="bg-surface-2">
                        <tr>
                            <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint">Estudiante</th>
                            @forelse ($continuas as $continua)
                                <th class="px-2 py-3 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">
                                    {{ $continua->nombre() }}
                                    @if ($continua->estaPublicada())
                                        <span class="block text-[10px] normal-case text-accent">Publicada</span>
                                    @endif
                                    @if ($puedeRegistrar)
                                        <span class="mt-1 flex items-center justify-center gap-1.5">
                                            <button type="button" wire:click="editarContinua({{ $continua->id }})" class="text-ink-faint transition hover:text-accent" title="Editar">
                                                <x-heroicon-o-pencil class="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                class="text-ink-faint transition hover:text-danger"
                                                title="Eliminar"
                                                x-on:click="$store.confirm.preguntar('¿Eliminar «{{ $continua->nombre() }}»? Se borran también las notas que ya tenga registradas.', () => $wire.eliminarContinua({{ $continua->id }}), { etiquetaConfirmar: 'Eliminar' })"
                                            >
                                                <x-heroicon-o-trash class="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    @endif
                                </th>
                            @empty
                                <th class="px-2 py-3 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">Sin continuas aún</th>
                            @endforelse
                            @if ($examen)
                                <th class="px-2 py-3 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">
                                    {{ $examen->nombre() }}
                                    @if ($examen->estaPublicada())
                                        <span class="block text-[10px] normal-case text-accent">Publicada</span>
                                    @endif
                                </th>
                            @endif
                            <th class="px-2 py-3 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">P{{ $mitadActual === 'primera' ? '1' : '2' }}</th>
                            <th class="px-2 py-3 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">Promedio final</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        @forelse ($estudiantes as $estudiante)
                            <tr>
                                <td class="px-4 py-2 text-ink">{{ $estudiante->nombreCompleto() }}</td>
                                @foreach ($columnas as $columna)
                                    <td class="px-2 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="20"
                                            wire:model="notas.{{ $estudiante->id }}.{{ $columna->id }}"
                                            placeholder="—"
                                            class="w-24 rounded-md border-border bg-surface px-1 text-center text-sm text-ink focus:border-accent focus:ring-accent"
                                            @disabled(! $puedeRegistrar)
                                        >
                                    </td>
                                @endforeach
                                <td class="px-2 py-2 text-center font-display text-ink">
                                    {{ $promedios[$estudiante->id] !== null ? number_format($promedios[$estudiante->id], 2) : '—' }}
                                </td>
                                <td class="px-2 py-2 text-center font-display text-accent">
                                    {{ $promediosFinales[$estudiante->id] !== null ? number_format($promediosFinales[$estudiante->id], 2) : '—' }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="99" class="px-4 py-8 text-center text-sm text-ink-faint">No hay estudiantes matriculados en este horario.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if ($puedeRegistrar && $estudiantes->isNotEmpty())
                <div class="mt-4 flex items-center justify-between">
                    <x-primary-button type="button" wire:click="guardarNotas">Guardar notas</x-primary-button>

                    @if ($puedePublicar)
                        <x-secondary-button type="button" x-on:click="$store.confirm.preguntar('¿Publicar las notas de la mitad {{ $mitadActual === 'primera' ? 'I' : 'II' }}? Los estudiantes podrán verlas.', () => $wire.publicarMitad(), { etiquetaConfirmar: 'Publicar' })">
                            Publicar mitad {{ $mitadActual === 'primera' ? 'I' : 'II' }}
                        </x-secondary-button>
                    @endif
                </div>
            @endif

            @if ($puedeRegistrar && $columnas->isNotEmpty())
                <div class="mt-6 rounded-2xl border border-border bg-surface shadow-sm p-4">
                    <h3 class="font-display text-sm text-ink">Importar notas desde un archivo</h3>
                    <p class="mt-1 text-xs text-ink-faint">
                        Para las evaluaciones rendidas por Google Forms: agrega una pregunta de DNI al formulario y exporta las respuestas a CSV o Excel.
                        El archivo debe tener una columna <code class="rounded bg-surface-2 px-1">dni</code>, una columna <code class="rounded bg-surface-2 px-1">nota</code> (0 a 20) y, opcionalmente, <code class="rounded bg-surface-2 px-1">observaciones</code>.
                    </p>

                    <form wire:submit="importarNotas" class="mt-3 flex flex-wrap items-end gap-3">
                        <div>
                            <x-input-label for="columnaImportar" value="Columna" />
                            <x-select-input
                                wire:model="columnaImportar"
                                id="columnaImportar"
                                class="mt-1 block w-full"
                                :options="$columnas->mapWithKeys(fn ($c) => [$c->id => $c->nombre()])"
                            />
                        </div>
                        <div class="flex-1">
                            <input
                                type="file"
                                wire:model="archivoNotas"
                                id="archivoNotas"
                                accept=".xlsx,.xls,.csv"
                                class="block w-full text-sm text-ink-dim file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
                            >
                            <div wire:loading wire:target="archivoNotas" class="mt-1 text-xs text-ink-faint">Subiendo…</div>
                            <x-input-error :messages="$errors->get('archivoNotas')" class="mt-1" />
                        </div>
                        <x-secondary-button type="submit" wire:loading.attr="disabled" wire:target="importarNotas">
                            <span wire:loading.remove wire:target="importarNotas">Importar</span>
                            <span wire:loading wire:target="importarNotas">Importando…</span>
                        </x-secondary-button>
                    </form>

                    @if ($resultadoImportacion)
                        <div class="mt-3 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-xs text-ok">
                            {{ $resultadoImportacion['exitosos'] }} nota{{ $resultadoImportacion['exitosos'] === 1 ? '' : 's' }} importada{{ $resultadoImportacion['exitosos'] === 1 ? '' : 's' }} correctamente.
                        </div>

                        @if (count($resultadoImportacion['errores']) > 0)
                            <div class="mt-2">
                                <p class="text-xs font-semibold text-danger">{{ count($resultadoImportacion['errores']) }} fila{{ count($resultadoImportacion['errores']) === 1 ? '' : 's' }} con errores:</p>
                                <div class="mt-1 max-h-48 overflow-y-auto rounded-md border border-border">
                                    <table class="min-w-full divide-y divide-border text-xs">
                                        <tbody class="divide-y divide-border">
                                            @foreach ($resultadoImportacion['errores'] as $error)
                                                <tr>
                                                    <td class="px-3 py-1.5 font-mono text-ink-dim">Fila {{ $error['fila'] }}</td>
                                                    <td class="px-3 py-1.5 text-danger">{{ $error['mensaje'] }}</td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        @endif
                    @endif
                </div>
            @endif

            @if ($puedeRegistrar)
                <div class="mt-6 rounded-2xl border border-border bg-surface shadow-sm p-4">
                    <h3 class="font-display text-sm text-ink">Comportamiento (AA)</h3>
                    <p class="mt-1 text-xs text-ink-faint">Nota aparte del Promedio Final, solo informativa -- una por estudiante para todo el curso.</p>

                    @if ($guardadoComportamiento)
                        <p class="mt-2 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">Comportamiento guardado.</p>
                    @endif

                    <div class="mt-3 divide-y divide-border rounded-lg border border-border">
                        @foreach ($estudiantes as $estudiante)
                            <div class="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                                <p class="text-ink">{{ $estudiante->nombreCompleto() }}</p>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="20"
                                    wire:model="comportamiento.{{ $estudiante->id }}"
                                    placeholder="—"
                                    class="w-24 rounded-md border-border bg-surface px-1 text-center text-sm text-ink focus:border-accent focus:ring-accent"
                                >
                            </div>
                        @endforeach
                    </div>

                    <div class="mt-3 flex justify-end">
                        <x-secondary-button type="button" wire:click="guardarComportamiento">Guardar comportamiento</x-secondary-button>
                    </div>
                </div>
            @endif
        @endif
    @elseif ($estaBloqueado)
        <div class="rounded-lg border border-danger/30 bg-danger/10 px-4 py-6 text-sm text-danger">
            <p class="font-medium">Tus notas no están disponibles.</p>
            <p class="mt-1">Tienes cuotas vencidas sin pagar. Regulariza tu deuda en
                <a href="{{ route('pagos.mi-cuenta') }}" wire:navigate class="underline">Mi estado de cuenta</a>
                o comunícate con Cobranza para un compromiso de pago.</p>
        </div>
    @else
        <div class="space-y-4">
            @if ($evaluacionesConEnlace->isNotEmpty())
                <div class="rounded-2xl border border-border bg-surface shadow-sm p-4">
                    <p class="text-xs uppercase tracking-wide text-ink-faint">Evaluaciones para rendir</p>
                    <div class="mt-3 divide-y divide-border">
                        @foreach ($evaluacionesConEnlace as $evaluacion)
                            <div class="flex items-center justify-between gap-4 py-2 text-sm">
                                <div>
                                    <p class="text-ink">{{ $evaluacion->nombre() }} · Mitad {{ $evaluacion->mitad->label() }}</p>
                                    <p class="text-xs text-ink-faint">
                                        @if ($evaluacion->disponible_hasta)
                                            Disponible hasta {{ $evaluacion->disponible_hasta->format('d/m/Y H:i') }}
                                        @endif
                                    </p>
                                </div>
                                <a href="{{ $evaluacion->enlace_externo }}" target="_blank" class="text-xs font-medium text-accent hover:underline">Abrir enlace →</a>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            @if ($resumenMitades)
                @foreach (['primera' => 'I', 'segunda' => 'II'] as $clave => $etiqueta)
                    <div class="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                        <table class="min-w-full divide-y divide-border text-sm">
                            <thead class="bg-surface-2">
                                <tr>
                                    <th class="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-ink-faint" colspan="2">Mitad {{ $etiqueta }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-border">
                                @forelse ($resumenMitades[$clave]['continuas'] as $continua)
                                    <tr>
                                        <td class="px-4 py-2 text-ink">{{ $continua['nombre'] }}</td>
                                        <td class="px-4 py-2 text-right text-ink">{{ $continua['nota'] !== null ? number_format($continua['nota'], 2) : '—' }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="2" class="px-4 py-3 text-center text-xs text-ink-faint">Todavía no hay continuas publicadas.</td>
                                    </tr>
                                @endforelse
                                <tr>
                                    <td class="px-4 py-2 text-ink">Examen</td>
                                    <td class="px-4 py-2 text-right text-ink">{{ $resumenMitades[$clave]['examen'] !== null ? number_format($resumenMitades[$clave]['examen'], 2) : '—' }}</td>
                                </tr>
                                <tr class="bg-surface-2">
                                    <td class="px-4 py-2 font-display text-ink">Promedio {{ $etiqueta === 'I' ? 'P1' : 'P2' }}</td>
                                    <td class="px-4 py-2 text-right font-display text-ink">{{ $resumenMitades[$clave]['promedio'] !== null ? number_format($resumenMitades[$clave]['promedio'], 2) : '—' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                @endforeach

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="rounded-2xl border border-border bg-surface shadow-sm p-4">
                        <p class="text-xs uppercase tracking-wide text-ink-faint">Promedio final del curso</p>
                        <p class="mt-1 font-display text-3xl text-accent">{{ $promedioFinal !== null ? number_format($promedioFinal, 2) : '—' }}</p>
                    </div>
                    <div class="rounded-2xl border border-border bg-surface shadow-sm p-4">
                        <p class="text-xs uppercase tracking-wide text-ink-faint">Comportamiento</p>
                        <p class="mt-1 font-display text-3xl text-ink">{{ $comportamientoPropio !== null ? number_format($comportamientoPropio, 2) : '—' }}</p>
                    </div>
                </div>
            @endif

            @if ($miEstudianteId)
                <a
                    href="{{ route('evaluaciones.libreta', ['estudiante' => $miEstudianteId, 'ciclo' => $horario->ciclo_id]) }}"
                    wire:navigate
                    class="inline-block text-sm font-medium text-accent hover:underline"
                >
                    Ver mi libreta del ciclo →
                </a>
            @endif
        </div>
    @endif
</div>
