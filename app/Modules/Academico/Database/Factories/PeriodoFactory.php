<?php

declare(strict_types=1);

namespace App\Modules\Academico\Database\Factories;

use App\Modules\Academico\Enums\EstadoCicloEnum;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Academico\Models\Periodo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Periodo>
 */
class PeriodoFactory extends Factory
{
    protected $model = Periodo::class;

    public function definition(): array
    {
        $anio = (int) $this->faker->year();

        return [
            'tipo' => TipoPeriodoEnum::PRIMERO,
            'anio' => $anio,
            'fecha_inicio' => "{$anio}-01-01",
            'fecha_fin' => "{$anio}-06-30",
            'estado' => EstadoCicloEnum::ACTIVO,
        ];
    }

    public function segundo(): static
    {
        return $this->state(function (array $attributes) {
            $anio = $attributes['anio'];

            return [
                'tipo' => TipoPeriodoEnum::SEGUNDO,
                'fecha_inicio' => "{$anio}-07-01",
                'fecha_fin' => "{$anio}-12-31",
            ];
        });
    }
}
