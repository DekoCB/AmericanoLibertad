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
 * El periodo SIAGIE del MINEDU (1.er periodo, 2.° periodo, Anual): un eje
 * completamente aparte del Ciclo rotativo de Americano Libertad (ver ModalidadCicloEnum,
 * CicloService). Solo el tipo ANUAL tiene además un Ciclo real detrás (con
 * Horarios propios, igual que un Ciclo rotativo) -- por eso su creación delega en
 * CicloService::crear(), reutilizando la misma validación de fechas (8
 * meses de clases) y de solape que ya existía para el Ciclo anual.
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
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio?: ?string, fecha_fin?: ?string, estado?: EstadoCicloEnum}  $datos
     */
    public function crear(array $datos): Periodo
    {
        $datos['estado'] ??= EstadoCicloEnum::PLANIFICADO;

        $this->validarSinDuplicado($datos['tipo'], $datos['anio']);

        if ($datos['tipo'] === TipoPeriodoEnum::ANUAL) {
            return $this->crearAnual($datos);
        }

        return Periodo::query()->create([
            'tipo' => $datos['tipo'],
            'anio' => $datos['anio'],
            'fecha_inicio' => $datos['fecha_inicio'] ?? null,
            'fecha_fin' => $datos['fecha_fin'] ?? null,
            'estado' => $datos['estado'],
        ]);
    }

    /**
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio?: ?string, fecha_fin?: ?string, estado?: EstadoCicloEnum}  $datos
     */
    public function actualizar(Periodo $periodo, array $datos): Periodo
    {
        $datos['estado'] ??= $periodo->estado;

        $this->validarSinDuplicado($datos['tipo'], $datos['anio'], $periodo->id);

        if ($datos['tipo'] === TipoPeriodoEnum::ANUAL) {
            return $this->actualizarAnual($periodo, $datos);
        }

        $periodo->update([
            'tipo' => $datos['tipo'],
            'anio' => $datos['anio'],
            'fecha_inicio' => $datos['fecha_inicio'] ?? null,
            'fecha_fin' => $datos['fecha_fin'] ?? null,
            'estado' => $datos['estado'],
        ]);

        return $periodo->fresh();
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
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio?: ?string, fecha_fin?: ?string, estado: EstadoCicloEnum}  $datos
     */
    private function crearAnual(array $datos): Periodo
    {
        if (($datos['fecha_inicio'] ?? null) === null || ($datos['fecha_fin'] ?? null) === null) {
            throw ValidationException::withMessages([
                'fecha_inicio' => 'El periodo Anual necesita fecha de inicio y de fin (su periodo de clases real).',
            ]);
        }

        return DB::transaction(function () use ($datos) {
            /** @var Periodo $periodo */
            $periodo = Periodo::query()->create([
                'tipo' => TipoPeriodoEnum::ANUAL,
                'anio' => $datos['anio'],
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'estado' => $datos['estado'],
            ]);

            $ciclo = $this->ciclos->crear([
                'nombre' => "Periodo Anual - {$datos['anio']}",
                'modalidad' => ModalidadCicloEnum::ANUAL,
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
     * @param  array{tipo: TipoPeriodoEnum, anio: int, fecha_inicio?: ?string, fecha_fin?: ?string, estado: EstadoCicloEnum}  $datos
     */
    private function actualizarAnual(Periodo $periodo, array $datos): Periodo
    {
        if (($datos['fecha_inicio'] ?? null) === null || ($datos['fecha_fin'] ?? null) === null) {
            throw ValidationException::withMessages([
                'fecha_inicio' => 'El periodo Anual necesita fecha de inicio y de fin (su periodo de clases real).',
            ]);
        }

        return DB::transaction(function () use ($periodo, $datos) {
            $ciclo = Ciclo::query()->where('siagie_id', $periodo->id)->first();

            if ($ciclo) {
                $this->ciclos->actualizar($ciclo, [
                    'nombre' => $ciclo->nombre,
                    'modalidad' => ModalidadCicloEnum::ANUAL,
                    'tipo' => null,
                    'anio' => $datos['anio'],
                    'fecha_inicio' => $datos['fecha_inicio'],
                    'fecha_fin' => $datos['fecha_fin'],
                    'estado' => $datos['estado'],
                ]);
            }

            $periodo->update([
                'anio' => $datos['anio'],
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'estado' => $datos['estado'],
            ]);

            return $periodo->fresh();
        });
    }
}
