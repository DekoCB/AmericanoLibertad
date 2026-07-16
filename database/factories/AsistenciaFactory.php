<?php

namespace Database\Factories;

use App\Models\Asistencia;
use App\Models\Course;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asistencia>
 */
class AsistenciaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $estado = fake()->randomElement(['presente', 'presente', 'presente', 'tardanza', 'falta', 'justificado']);

        return [
            'course_id' => Course::factory(),
            'student_id' => Student::factory(),
            'fecha' => fake()->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
            'estado' => $estado,
            'hora_registro' => $estado === 'falta' ? null : now(),
            'registrado_por' => null,
        ];
    }
}
