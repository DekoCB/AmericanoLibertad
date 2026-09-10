<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Carrera;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Carrera>
 */
class CarreraFactory extends Factory
{
    protected $model = Carrera::class;

    public function definition(): array
    {
        $secuencia = Carrera::query()->count() + 1;

        return [
            'name' => 'Carrera de prueba '.$secuencia,
            'code' => 'CAR'.str_pad((string) $secuencia, 2, '0', STR_PAD_LEFT),
            'total_ciclos' => 6,
        ];
    }
}
