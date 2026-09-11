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
        return [
            'tipo' => TipoPeriodoEnum::PRIMERO,
            'anio' => (int) $this->faker->year(),
            'fecha_inicio' => null,
            'fecha_fin' => null,
            'estado' => EstadoCicloEnum::ACTIVO,
        ];
    }

    public function anual(): static
    {
        return $this->state(function (array $attributes) {
            $anio = $attributes['anio'];

            return [
                'tipo' => TipoPeriodoEnum::ANUAL,
                'fecha_inicio' => "{$anio}-03-01",
                'fecha_fin' => "{$anio}-10-31",
            ];
        });
    }
}
