<?php

declare(strict_types=1);

namespace App\Modules\Migraciones\Database\Factories;

use App\Modules\Academico\Models\Curso;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MatriculaRefuerzo>
 */
class MatriculaRefuerzoFactory extends Factory
{
    protected $model = MatriculaRefuerzo::class;

    public function definition(): array
    {
        return [
            'matricula_id' => Matricula::factory(),
            'curso_id' => Curso::factory(),
            'horario_id' => null,
            'estado' => EstadoRefuerzoEnum::PENDIENTE,
            'matricula_origen_id' => null,
        ];
    }
}
