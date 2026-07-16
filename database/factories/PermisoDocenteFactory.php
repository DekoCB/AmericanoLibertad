<?php

namespace Database\Factories;

use App\Models\PermisoDocente;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PermisoDocente>
 */
class PermisoDocenteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $inicio = fake()->dateTimeBetween('-1 month', '+1 month');

        return [
            'teacher_id' => Teacher::factory(),
            'tipo' => fake()->randomElement(['permiso', 'licencia', 'vacaciones']),
            'fecha_inicio' => $inicio->format('Y-m-d'),
            'fecha_fin' => (clone $inicio)->modify('+'.random_int(1, 5).' days')->format('Y-m-d'),
            'motivo' => fake()->sentence(8),
            'estado' => fake()->randomElement(['pendiente', 'aprobado', 'rechazado']),
            'respondido_por' => null,
        ];
    }
}
