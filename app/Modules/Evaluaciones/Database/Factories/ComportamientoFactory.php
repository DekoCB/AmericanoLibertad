<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Database\Factories;

use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Models\Comportamiento;
use App\Modules\Matricula\Models\Estudiante;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Comportamiento>
 */
class ComportamientoFactory extends Factory
{
    protected $model = Comportamiento::class;

    public function definition(): array
    {
        return [
            'horario_id' => Horario::factory(),
            'estudiante_id' => Estudiante::factory(),
            'nota_numerica' => $this->faker->randomFloat(2, 0, 20),
            'registrado_por' => null,
        ];
    }
}
