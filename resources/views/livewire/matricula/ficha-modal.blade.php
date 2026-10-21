<?php

use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Matricula\Enums\EstadoCivilEnum;
use App\Modules\Matricula\Enums\TipoDocumentoEnum;
use App\Modules\Matricula\Models\DocumentoEstudiante;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Matricula\Services\DocumentoEstudianteService;
use App\Modules\Matricula\Services\MatriculaService;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use App\Modules\Pagos\Models\CargoAdicional;
use App\Modules\Pagos\Models\PlanPago;
use App\Modules\Pagos\Services\CargoAdicionalService;
use App\Modules\Pagos\Services\PlanPagoService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Livewire\Attributes\On;
use Livewire\Volt\Component;
use Livewire\WithFileUploads;

/**
 * Modal "Ver" de matricula/index.blade.php, aislado en su propio componente
 * para que abrirlo no dispare una re-consulta de la lista paginada completa
 * (con eso el modal se anima al instante y solo carga los datos del
 * estudiante seleccionado, no toda la tabla).
 */
new class extends Component
{
    use WithFileUploads;

    public ?int $estudianteId = null;

    public string $observacionesTexto = '';

    public bool $editandoDatosPersonales = false;

    public string $dniNuevo = '';

    public string $nombresNuevo = '';

    public string $apellidosNuevo = '';

    public string $fechaNacimientoNueva = '';

    public string $estadoCivilNuevo = '';

    public string $celularNuevo = '';

    public string $emailNuevo = '';

    public string $direccionNueva = '';

    public ?int $editandoFechaFinMatriculaId = null;

    public string $fechaFinEstudioNueva = '';

    public ?int $editandoHorarioMatriculaId = null;

    public ?int $editandoHorarioCursoId = null;

    public string $horarioSeleccionado = '';

    public ?int $editandoMontoPlanId = null;

    public string $montoTotalNuevo = '';

    public ?int $editandoMontoCargoId = null;

    public string $montoCargoNuevo = '';

    public bool $agregandoCargo = false;

    public string $cargoConceptoNuevo = '';

    public string $cargoMontoNuevo = '';

    public ?string $subiendoDocumentoTipo = null;

    public $documentoCaraArchivo = null;

    public $documentoReversoArchivo = null;

    #[On('ver-estudiante')]
    public function abrir(int $estudianteId): void
    {
        Gate::authorize('matricula.ver');

        $this->estudianteId = $estudianteId;
        $this->observacionesTexto = Estudiante::query()->find($estudianteId)?->observaciones ?? '';
        $this->editandoDatosPersonales = false;
        $this->dniNuevo = '';
        $this->nombresNuevo = '';
        $this->apellidosNuevo = '';
        $this->fechaNacimientoNueva = '';
        $this->estadoCivilNuevo = '';
        $this->celularNuevo = '';
        $this->emailNuevo = '';
        $this->direccionNueva = '';
        $this->editandoFechaFinMatriculaId = null;
        $this->fechaFinEstudioNueva = '';
        $this->editandoHorarioMatriculaId = null;
        $this->editandoHorarioCursoId = null;
        $this->horarioSeleccionado = '';
        $this->editandoMontoPlanId = null;
        $this->montoTotalNuevo = '';
        $this->editandoMontoCargoId = null;
        $this->montoCargoNuevo = '';
        $this->agregandoCargo = false;
        $this->cargoConceptoNuevo = '';
        $this->cargoMontoNuevo = '';
        $this->subiendoDocumentoTipo = null;
        $this->documentoCaraArchivo = null;
        $this->documentoReversoArchivo = null;
    }

    public function verificarDocumento(int $documentoId, DocumentoEstudianteService $service): void
    {
        Gate::authorize('matricula.editar');

        $documento = DocumentoEstudiante::query()->findOrFail($documentoId);
        $service->verificar($documento);
    }

    /**
     * No se puede usar Pdf::loadView(...)->download() aquí: eso devuelve un
     * Illuminate\Http\Response plano, que Livewire no reconoce como
     * descarga de archivo (ver el mismo fix en reportes/index.blade.php y
     * historial-estudiante/index.blade.php). streamDownload() sí.
     */
    public function descargarDniPdf(int $documentoId, DocumentoEstudianteService $service)
    {
        Gate::authorize('matricula.ver');

        $documento = DocumentoEstudiante::query()->with('estudiante')->findOrFail($documentoId);

        return response()->streamDownload(
            fn () => print ($service->generarPdfDni($documento)->output()),
            "dni-{$documento->tipo->value}-{$documento->estudiante_id}.pdf",
            ['Content-Type' => 'application/pdf'],
        );
    }

    public function guardarObservaciones(): void
    {
        Gate::authorize('matricula.editar');

        Estudiante::query()->findOrFail($this->estudianteId)->update(['observaciones' => $this->observacionesTexto ?: null]);
    }

    public function editarDatosPersonales(): void
    {
        Gate::authorize('matricula.editar');

        $estudiante = Estudiante::query()->findOrFail($this->estudianteId);

        $this->dniNuevo = $estudiante->dni;
        $this->nombresNuevo = $estudiante->nombres;
        $this->apellidosNuevo = $estudiante->apellidos;
        $this->fechaNacimientoNueva = $estudiante->fecha_nacimiento->format('Y-m-d');
        $this->estadoCivilNuevo = $estudiante->estado_civil?->value ?? '';
        $this->celularNuevo = $estudiante->celular ?? '';
        $this->emailNuevo = $estudiante->email ?? '';
        $this->direccionNueva = $estudiante->direccion ?? '';
        $this->editandoDatosPersonales = true;
    }

    public function cancelarEdicionDatosPersonales(): void
    {
        $this->editandoDatosPersonales = false;
    }

    public function guardarDatosPersonales(MatriculaService $service): void
    {
        Gate::authorize('matricula.editar');

        if ($this->estudianteId === null) {
            return;
        }

        $estudiante = Estudiante::query()->findOrFail($this->estudianteId);

        $this->validate([
            'dniNuevo' => [
                'required',
                'string',
                'regex:/^[0-9A-Za-z]{8,12}$/',
                Rule::unique('estudiantes', 'dni')->ignore($estudiante->id),
                Rule::unique('users', 'dni')->ignore($estudiante->user_id),
            ],
            'nombresNuevo' => 'required|string|max:100',
            'apellidosNuevo' => 'required|string|max:100',
            'fechaNacimientoNueva' => 'required|date|before:today',
            'estadoCivilNuevo' => 'nullable|string|in:'.implode(',', array_column(EstadoCivilEnum::cases(), 'value')),
            'celularNuevo' => 'nullable|string|max:20',
            'emailNuevo' => 'nullable|email|max:150',
            'direccionNueva' => 'nullable|string|max:255',
        ]);

        // corregirDni() recalcula el correo institucional ({dni}@...) si el
        // DNI cambió, y lo aplica a la ficha y a la cuenta de acceso -- por
        // eso $emailNuevo solo se usa cuando el DNI se queda igual.
        $dniCambio = strtoupper(trim($this->dniNuevo)) !== $estudiante->dni;
        $correoInstitucionalNuevo = $service->corregirDni($estudiante, $this->dniNuevo);

        $estudiante->update([
            'nombres' => $this->nombresNuevo,
            'apellidos' => $this->apellidosNuevo,
            'fecha_nacimiento' => $this->fechaNacimientoNueva,
            'estado_civil' => $this->estadoCivilNuevo !== '' ? EstadoCivilEnum::from($this->estadoCivilNuevo) : null,
            'celular' => $this->celularNuevo !== '' ? $this->celularNuevo : null,
            'email' => $dniCambio ? $correoInstitucionalNuevo : ($this->emailNuevo !== '' ? $this->emailNuevo : null),
            'direccion' => $this->direccionNueva !== '' ? $this->direccionNueva : null,
        ]);

        $this->editandoDatosPersonales = false;
    }

    public function editarFechaFinEstudio(int $matriculaId): void
    {
        Gate::authorize('matricula.editar');

        $matricula = Matricula::query()->findOrFail($matriculaId);

        $this->editandoFechaFinMatriculaId = $matriculaId;
        $this->fechaFinEstudioNueva = $matricula->fecha_fin_estudio?->format('Y-m-d') ?? '';
    }

    public function cancelarEdicionFechaFinEstudio(): void
    {
        $this->editandoFechaFinMatriculaId = null;
        $this->fechaFinEstudioNueva = '';
    }

    public function guardarFechaFinEstudio(MatriculaService $service): void
    {
        Gate::authorize('matricula.editar');

        if ($this->editandoFechaFinMatriculaId === null) {
            return;
        }

        $this->validate(['fechaFinEstudioNueva' => 'required|date']);

        $matricula = Matricula::query()->findOrFail($this->editandoFechaFinMatriculaId);

        $service->reasignarFechaFinEstudio($matricula, $this->fechaFinEstudioNueva);

        $this->editandoFechaFinMatriculaId = null;
        $this->fechaFinEstudioNueva = '';
    }

    public function editarHorario(int $matriculaId, int $cursoId): void
    {
        Gate::authorize('matricula.editar');

        $matricula = Matricula::query()->findOrFail($matriculaId);
        $asignado = $matricula->horarios()->where('curso_id', $cursoId)->first();

        $this->editandoHorarioMatriculaId = $matriculaId;
        $this->editandoHorarioCursoId = $cursoId;
        $this->horarioSeleccionado = $asignado !== null ? (string) $asignado->id : '';
    }

    public function cancelarEdicionHorario(): void
    {
        $this->editandoHorarioMatriculaId = null;
        $this->editandoHorarioCursoId = null;
        $this->horarioSeleccionado = '';
    }

    public function guardarHorario(MatriculaService $service): void
    {
        Gate::authorize('matricula.editar');

        if ($this->editandoHorarioMatriculaId === null || $this->editandoHorarioCursoId === null) {
            return;
        }

        $matricula = Matricula::query()->findOrFail($this->editandoHorarioMatriculaId);

        $service->asignarHorarioDeCurso(
            $matricula,
            $this->editandoHorarioCursoId,
            $this->horarioSeleccionado !== '' ? (int) $this->horarioSeleccionado : null,
        );

        $this->editandoHorarioMatriculaId = null;
        $this->editandoHorarioCursoId = null;
        $this->horarioSeleccionado = '';
    }

    public function editarMontoPlan(int $planId): void
    {
        Gate::authorize('pagos.gestionar');

        $plan = PlanPago::query()->findOrFail($planId);

        $this->editandoMontoPlanId = $planId;
        $this->montoTotalNuevo = (string) $plan->monto_total;
    }

    public function cancelarEdicionMontoPlan(): void
    {
        $this->editandoMontoPlanId = null;
        $this->montoTotalNuevo = '';
    }

    public function guardarMontoPlan(PlanPagoService $service): void
    {
        Gate::authorize('pagos.gestionar');

        if ($this->editandoMontoPlanId === null) {
            return;
        }

        $this->validate(['montoTotalNuevo' => 'required|numeric|min:0.01']);

        $plan = PlanPago::query()->findOrFail($this->editandoMontoPlanId);

        $service->editarMontoTotal($plan, (float) $this->montoTotalNuevo);

        $this->editandoMontoPlanId = null;
        $this->montoTotalNuevo = '';
    }

    public function editarMontoCargo(int $cargoId): void
    {
        Gate::authorize('pagos.gestionar');

        $cargo = CargoAdicional::query()->findOrFail($cargoId);

        $this->editandoMontoCargoId = $cargoId;
        $this->montoCargoNuevo = (string) $cargo->monto;
    }

    public function cancelarEdicionMontoCargo(): void
    {
        $this->editandoMontoCargoId = null;
        $this->montoCargoNuevo = '';
    }

    public function guardarMontoCargo(CargoAdicionalService $service): void
    {
        Gate::authorize('pagos.gestionar');

        if ($this->editandoMontoCargoId === null) {
            return;
        }

        $this->validate(['montoCargoNuevo' => 'required|numeric|min:0.01']);

        $cargo = CargoAdicional::query()->findOrFail($this->editandoMontoCargoId);

        $service->editarMonto($cargo, (float) $this->montoCargoNuevo);

        $this->editandoMontoCargoId = null;
        $this->montoCargoNuevo = '';
    }

    public function mostrarFormularioCargo(): void
    {
        Gate::authorize('pagos.gestionar');

        $this->agregandoCargo = true;
    }

    public function cancelarNuevoCargo(): void
    {
        $this->agregandoCargo = false;
        $this->cargoConceptoNuevo = '';
        $this->cargoMontoNuevo = '';
    }

    public function guardarNuevoCargo(CargoAdicionalService $service): void
    {
        Gate::authorize('pagos.gestionar');

        if ($this->estudianteId === null) {
            return;
        }

        $this->validate([
            'cargoConceptoNuevo' => 'required|string|max:100',
            'cargoMontoNuevo' => 'required|numeric|min:0.01',
        ]);

        $service->crear(
            Estudiante::query()->findOrFail($this->estudianteId),
            $this->cargoConceptoNuevo,
            (float) $this->cargoMontoNuevo,
            Auth::id(),
        );

        $this->agregandoCargo = false;
        $this->cargoConceptoNuevo = '';
        $this->cargoMontoNuevo = '';
    }

    public function mostrarFormularioDocumento(string $tipo): void
    {
        Gate::authorize('matricula.editar');

        $this->subiendoDocumentoTipo = $tipo;
        $this->documentoCaraArchivo = null;
        $this->documentoReversoArchivo = null;
    }

    public function cancelarDocumento(): void
    {
        $this->subiendoDocumentoTipo = null;
        $this->documentoCaraArchivo = null;
        $this->documentoReversoArchivo = null;
    }

    public function guardarDocumento(DocumentoEstudianteService $service): void
    {
        Gate::authorize('matricula.editar');

        if ($this->subiendoDocumentoTipo === null || $this->estudianteId === null) {
            return;
        }

        $this->validate([
            'documentoCaraArchivo' => 'required|file|mimes:pdf,jpg,jpeg,png|max:4096',
            'documentoReversoArchivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
        ]);

        $service->subir(
            Estudiante::query()->findOrFail($this->estudianteId),
            TipoDocumentoEnum::from($this->subiendoDocumentoTipo),
            $this->documentoCaraArchivo,
            Auth::id(),
            $this->documentoReversoArchivo,
        );

        $this->subiendoDocumentoTipo = null;
        $this->documentoCaraArchivo = null;
        $this->documentoReversoArchivo = null;
    }

    /**
     * Los cursos de la carrera y ciclo curricular de esta matrícula, cada
     * uno con sus horarios disponibles (por si tiene varias secciones),
     * cuál está asignado explícitamente (si alguno) y si hace falta elegir
     * uno ("ambiguo" = el curso tiene más de una sección, ver
     * Matricula::scopeDelHorario()).
     *
     * @return Collection<int, array{curso: Curso, opciones: Collection<int, Horario>, asignado: ?Horario, ambiguo: bool}>
     */
    private function cursosConHorarios(Matricula $matricula): Collection
    {
        $horariosPorCurso = Horario::query()
            ->where('ciclo_id', $matricula->ciclo_id)
            ->where('carrera_id', $matricula->carrera_id)
            ->where('ciclo_curricular', $matricula->ciclo_curricular)
            ->with(['curso', 'docente', 'dias'])
            ->get()
            ->groupBy('curso_id');

        $asignadosPorCurso = $matricula->horarios->keyBy('curso_id');

        return $horariosPorCurso
            ->map(fn (Collection $opciones, int $cursoId) => [
                'curso' => $opciones->first()->curso,
                'opciones' => $opciones->sortBy(fn (Horario $horario) => $horario->diasResumen())->values(),
                'asignado' => $asignadosPorCurso->get($cursoId),
                'ambiguo' => $opciones->count() > 1,
            ])
            ->sortBy(fn (array $entrada) => $entrada['curso']->nombre)
            ->values();
    }

    /**
     * Los cursos que el estudiante está repitiendo en esta matrícula por
     * haberlos desaprobado antes -- cada uno con su propio ciclo_curricular,
     * que puede ser menor al de la matrícula (ver MatriculaRefuerzo).
     *
     * @return Collection<int, array{curso: Curso, horario: ?Horario, estado: EstadoRefuerzoEnum}>
     */
    private function refuerzosConEstado(Matricula $matricula): Collection
    {
        return $matricula->refuerzos()
            ->with(['curso', 'horario.docente'])
            ->get()
            ->map(fn (MatriculaRefuerzo $refuerzo) => [
                'curso' => $refuerzo->curso,
                'horario' => $refuerzo->horario,
                'estado' => $refuerzo->estado,
            ])
            ->sortBy(fn (array $entrada) => $entrada['curso']->nombre)
            ->values();
    }

    public function with(PlanPagoService $planes): array
    {
        $estudiante = $this->estudianteId ? Estudiante::query()->with(['media', 'user.media', 'telefonos'])->find($this->estudianteId) : null;

        $matriculas = $estudiante?->matriculas()->with(['ciclo', 'carrera', 'horarios.curso', 'horarios.docente', 'media'])->latest('fecha_matricula')->get();

        return [
            'estudiante' => $estudiante,
            'documentos' => $estudiante?->documentos()->with('media')->get(),
            'examenes' => $estudiante?->examenesUbicacion()->with('carreraAsignada')->latest('fecha')->get(),
            'matriculas' => $matriculas,
            'cursosConHorarios' => $matriculas?->mapWithKeys(fn (Matricula $matricula) => [$matricula->id => $this->cursosConHorarios($matricula)]) ?? collect(),
            'refuerzosPorMatricula' => $matriculas?->mapWithKeys(fn (Matricula $matricula) => [$matricula->id => $this->refuerzosConEstado($matricula)]) ?? collect(),
            'planesPorMatricula' => $matriculas !== null && Auth::user()->hasPermissionTo('pagos.ver')
                ? $matriculas->mapWithKeys(fn (Matricula $matricula) => [$matricula->id => $planes->planDe($matricula)])
                : collect(),
            'cargosAdicionales' => $estudiante !== null && Auth::user()->hasPermissionTo('pagos.ver')
                ? CargoAdicional::query()->where('estudiante_id', $estudiante->id)->get()
                : collect(),
            'tiposDocumento' => $this->tiposDocumento($estudiante),
        ];
    }

    /**
     * Los tipos de documento relevantes para este estudiante -- DNI del
     * apoderado solo si es menor de edad. Se listan todos (suba o no cada
     * uno) para que "Documentos" ofrezca subir los que falten, no solo
     * mostrar los que ya existen.
     *
     * @return list<TipoDocumentoEnum>
     */
    private function tiposDocumento(?Estudiante $estudiante): array
    {
        return array_filter([
            TipoDocumentoEnum::DNI_ESTUDIANTE,
            $estudiante?->es_menor_edad ? TipoDocumentoEnum::DNI_APODERADO : null,
            TipoDocumentoEnum::CERTIFICADO_ESTUDIOS,
            TipoDocumentoEnum::CONSTANCIA,
        ]);
    }
}; ?>

<div>
    <x-modal name="ver-ficha" :tv="true" max-width="2xl">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
                <h2 class="font-display text-lg text-ink">{{ $estudiante?->nombreCompleto() ?? 'Ficha del estudiante' }}</h2>
                @if ($estudiante)
                    <p class="text-sm text-ink-dim">DNI {{ $estudiante->dni }} · {{ $estudiante->es_menor_edad ? 'Menor de edad' : 'Mayor de edad' }}</p>
                @endif
            </div>
            <button type="button" x-on:click="$dispatch('close')" class="rounded-md p-1.5 text-ink-faint transition hover:bg-surface-2 hover:text-ink" aria-label="Cerrar">
                <x-heroicon-o-x-mark class="h-5 w-5" />
            </button>
        </div>

        <div class="max-h-[75vh] overflow-y-auto p-6" wire:loading.class="opacity-50">
            @if ($estudiante)
                <x-matricula.ficha-estudiante
                    :estudiante="$estudiante"
                    :editando-datos-personales="$editandoDatosPersonales"
                    :dni-nuevo="$dniNuevo"
                    :nombres-nuevo="$nombresNuevo"
                    :apellidos-nuevo="$apellidosNuevo"
                    :fecha-nacimiento-nueva="$fechaNacimientoNueva"
                    :estado-civil-nuevo="$estadoCivilNuevo"
                    :celular-nuevo="$celularNuevo"
                    :email-nuevo="$emailNuevo"
                    :direccion-nueva="$direccionNueva"
                    :documentos="$documentos"
                    :examenes="$examenes"
                    :matriculas="$matriculas"
                    :cursos-con-horarios="$cursosConHorarios"
                    :refuerzos-por-matricula="$refuerzosPorMatricula"
                    :editando-horario-matricula-id="$editandoHorarioMatriculaId"
                    :editando-horario-curso-id="$editandoHorarioCursoId"
                    :horario-seleccionado="$horarioSeleccionado"
                    :editando-fecha-fin-matricula-id="$editandoFechaFinMatriculaId"
                    :fecha-fin-estudio-nueva="$fechaFinEstudioNueva"
                    :planes-por-matricula="$planesPorMatricula"
                    :editando-monto-plan-id="$editandoMontoPlanId"
                    :monto-total-nuevo="$montoTotalNuevo"
                    :cargos-adicionales="$cargosAdicionales"
                    :editando-monto-cargo-id="$editandoMontoCargoId"
                    :monto-cargo-nuevo="$montoCargoNuevo"
                    :agregando-cargo="$agregandoCargo"
                    :cargo-concepto-nuevo="$cargoConceptoNuevo"
                    :cargo-monto-nuevo="$cargoMontoNuevo"
                    :tipos-documento="$tiposDocumento"
                    :subiendo-documento-tipo="$subiendoDocumentoTipo"
                />
            @else
                <p class="py-8 text-center text-sm text-ink-faint">Cargando…</p>
            @endif
        </div>
    </x-modal>
</div>
