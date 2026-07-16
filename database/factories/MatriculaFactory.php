<?php

namespace Database\Factories;

use App\Models\Carrera;
use App\Models\Matricula;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Matricula>
 */
class MatriculaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ciclo = fake()->numberBetween(1, 6);

        return [
            'student_id' => Student::factory(),
            'carrera_id' => Carrera::factory(),
            'ciclo' => $ciclo,
            'turno' => fake()->randomElement(['mañana', 'tarde', 'noche']),
            'period' => '2026-1',
            'monto_matricula' => Matricula::montoSugerido($ciclo),
            'fecha_matricula' => fake()->dateTimeBetween('-3 months', 'now'),
            'estado' => 'pendiente',
        ];
    }
}
