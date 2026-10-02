<?php

declare(strict_types=1);

namespace App\Modules\Academico\Services;

use App\Modules\Academico\Enums\EstadoCicloEnum;
use App\Modules\Academico\Enums\ModalidadCicloEnum;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Periodo;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * El periodo de matrícula del año (1.er periodo, 2.° periodo): desde que
 * se retiró el Ciclo rotativo de 4 ventanas, todo Periodo tiene siempre un
 * Ciclo real detrás (con sus propios Horarios) -- su creación delega en
 * CicloService::crear(), reutilizando la misma validación de fechas/solape
 * que antes solo corría para el extinto Periodo anual.
 */
class PeriodoService
{
    public function __construct(
        private readonly CicloService $ciclos,
    ) {}

    /**
     * @return Collection<int, Periodo>
     */
    public function listar(): Collection
    {
        return Periodo::query()->orderByDesc('anio')->orderBy('tipo')->get();
    }

    /**
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio: string, fecha_fin: string, estado?: EstadoCicloEnum}  $datos
     */
    public function crear(array $datos): Periodo
    {
        $datos['estado'] ??= EstadoCicloEnum::PLANIFICADO;

        $this->validarSinDuplicado($datos['tipo'], $datos['anio']);
        $this->validarFechasCompletas($datos);

        return DB::transaction(function () use ($datos) {
            /** @var Periodo $periodo */
            $periodo = Periodo::query()->create([
                'tipo' => $datos['tipo'],
                'anio' => $datos['anio'],
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'estado' => $datos['estado'],
            ]);

            $ciclo = $this->ciclos->crear([
                'nombre' => "Periodo {$periodo->nombreCompleto()}",
                'modalidad' => ModalidadCicloEnum::SEIS_MESES,
                'tipo' => null,
                'anio' => $datos['anio'],
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
            ]);

            $ciclo->update(['siagie_id' => $periodo->id, 'estado' => $datos['estado']]);

            return $periodo;
        });
    }

    /**
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio: string, fecha_fin: string, estado?: EstadoCicloEnum}  $datos
     */
    public function actualizar(Periodo $periodo, array $datos): Periodo
    {
        $datos['estado'] ??= $periodo->estado;

        $this->validarSinDuplicado($datos['tipo'], $datos['anio'], $periodo->id);
        $this->validarFechasCompletas($datos);

        return DB::transaction(function () use ($periodo, $datos) {
            $ciclo = Ciclo::query()->where('siagie_id', $periodo->id)->first();

            $periodo->update([
                'tipo' => $datos['tipo'],
                'anio' => $datos['anio'],
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'estado' => $datos['estado'],
            ]);

            if ($ciclo) {
                $this->ciclos->actualizar($ciclo, [
                    'nombre' => "Periodo {$periodo->nombreCompleto()}",
                    'modalidad' => ModalidadCicloEnum::SEIS_MESES,
                    'tipo' => null,
                    'anio' => $datos['anio'],
                    'fecha_inicio' => $datos['fecha_inicio'],
                    'fecha_fin' => $datos['fecha_fin'],
                    'estado' => $datos['estado'],
                ]);
            }

            return $periodo->fresh();
        });
    }

    /**
     * El periodo cronológicamente siguiente a $actual (1.er periodo ->
     * 2.° del mismo año -> 1.er periodo del año siguiente), si ya se
     * creó. Es la fuente de "cuál sigue" para migrar un Ciclo nacido de
     * un Periodo -- esos Ciclos no tienen el `tipo` rotativo (1 a 4) que
     * usaba CicloService::siguienteCiclo().
     */
    public function periodoSiguiente(Periodo $actual): ?Periodo
    {
        [$anioSiguiente, $tipoSiguiente] = $actual->tipo === TipoPeriodoEnum::PRIMERO
            ? [$actual->anio, TipoPeriodoEnum::SEGUNDO]
            : [$actual->anio + 1, TipoPeriodoEnum::PRIMERO];

        return Periodo::query()
            ->where('anio', $anioSiguiente)
            ->where('tipo', $tipoSiguiente)
            ->first();
    }

    private function validarSinDuplicado(TipoPeriodoEnum $tipo, int $anio, ?int $exceptoId = null): void
    {
        $existe = Periodo::query()
            ->where('tipo', $tipo)
            ->where('anio', $anio)
            ->when($exceptoId, fn ($query) => $query->whereKeyNot($exceptoId))
            ->exists();

        if ($existe) {
            throw ValidationException::withMessages([
                'anio' => "Ya existe un periodo {$tipo->label()} para el año {$anio}.",
            ]);
        }
    }

    /**
     * @param  array{fecha_inicio?: ?string, fecha_fin?: ?string}  $datos
     */
    private function validarFechasCompletas(array $datos): void
    {
        if (($datos['fecha_inicio'] ?? null) === null || ($datos['fecha_fin'] ?? null) === null) {
            throw ValidationException::withMessages([
                'fecha_inicio' => 'El periodo necesita fecha de inicio y de fin (su periodo de clases real).',
            ]);
        }
    }
}
