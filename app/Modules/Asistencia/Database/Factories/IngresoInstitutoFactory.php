<?php

declare(strict_types=1);

namespace App\Modules\Asistencia\Database\Factories;

use App\Modules\Asistencia\Models\IngresoInstituto;
use App\Modules\Matricula\Models\Estudiante;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IngresoInstituto>
 */
class IngresoInstitutoFactory extends Factory
{
    protected $model = IngresoInstituto::class;

    public function definition(): array
    {
        return [
            'estudiante_id' => Estudiante::factory(),
            'fecha' => now()->format('Y-m-d'),
            'llego_tarde' => false,
        ];
    }
}
