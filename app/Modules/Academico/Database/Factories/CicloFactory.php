<?php

declare(strict_types=1);

namespace App\Modules\Academico\Database\Factories;

use App\Modules\Academico\Enums\EstadoCicloEnum;
use App\Modules\Academico\Enums\TipoCicloEnum;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Periodo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ciclo>
 */
class CicloFactory extends Factory
{
    protected $model = Ciclo::class;

    /**
     * Un Ciclo sin ventana rotativa (`tipo` nulo) siempre tiene un Periodo
     * real vinculado (ver PeriodoService::crear()): sin esto, cualquier
     * test que use conPeriodo() quedaría con un Ciclo huérfano que
     * Vacaciones/Evaluaciones/Libreta (que consultan Ciclo::periodo) no
     * reconocerían como tal.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Ciclo $ciclo): void {
            if ($ciclo->tipo !== null || $ciclo->siagie_id !== null) {
                return;
            }

            $periodo = Periodo::query()->firstOrCreate(
                ['tipo' => TipoPeriodoEnum::PRIMERO, 'anio' => $ciclo->anio],
                ['fecha_inicio' => $ciclo->fecha_inicio, 'fecha_fin' => $ciclo->fecha_fin, 'estado' => $ciclo->estado],
            );

            $ciclo->update(['siagie_id' => $periodo->id]);
        });
    }

    public function definition(): array
    {
        // Tope en el pasado (no 'now', el default de Faker): activo() ahora marca
        // "el ciclo actual" con fechas centradas en hoy (ver más abajo), así que un
        // Ciclo "no activo" generado con un año aleatorio que por azar cayera en el
        // actual podría, sin querer, solaparse con hoy y pasar la nueva condición
        // por fecha de EloquentCicloRepository::activo().
        $anio = (int) $this->faker->year(now()->subYears(2));
        $inicio = "{$anio}-01-01";
        $fin = "{$anio}-06-30";

        return [
            'nombre' => "Ciclo 1 - {$anio}",
            'tipo' => TipoCicloEnum::CICLO_1,
            'anio' => $anio,
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin,
            'estado' => EstadoCicloEnum::PLANIFICADO,
        ];
    }

    public function ciclo3(): static
    {
        return $this->state(function (array $attributes) {
            $anio = $attributes['anio'];

            return [
                'nombre' => "Ciclo 3 - {$anio}",
                'tipo' => TipoCicloEnum::CICLO_3,
                'fecha_inicio' => "{$anio}-07-01",
                'fecha_fin' => "{$anio}-12-31",
            ];
        });
    }

    /**
     * "Activo" ya no se decide por la columna `estado` (ver
     * EloquentCicloRepository::activo()): sin fijar también las fechas
     * para que incluyan hoy, un Ciclo con `estado = ACTIVO` pero con el
     * rango de fechas aleatorio del año de definition() no sería detectado
     * como el ciclo actual, y los tests que usan este estado para simular
     * "el ciclo en curso" dejarían de representar lo que dicen representar.
     */
    public function activo(): static
    {
        return $this->state([
            'estado' => EstadoCicloEnum::ACTIVO,
            'fecha_inicio' => now()->subMonth()->toDateString(),
            'fecha_fin' => now()->addMonth()->toDateString(),
        ]);
    }

    /**
     * Un Ciclo nacido de un Periodo (ver PeriodoService): sin la ventana
     * rotativa de 6 meses (`tipo` nulo), con su Periodo real vinculado por
     * configure() arriba.
     */
    public function conPeriodo(): static
    {
        return $this->state(function (array $attributes) {
            $anio = $attributes['anio'];

            return [
                'nombre' => "Periodo {$anio}-1",
                'tipo' => null,
                'fecha_inicio' => "{$anio}-01-01",
                'fecha_fin' => "{$anio}-06-30",
            ];
        });
    }
}
