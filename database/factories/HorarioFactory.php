<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Horario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Horario>
 */
class HorarioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $horaInicio = fake()->randomElement([8, 10, 14, 16, 18, 19]);

        return [
            'course_id' => Course::factory(),
            'dia_semana' => fake()->randomElement(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
            'hora_inicio' => sprintf('%02d:00', $horaInicio),
            'hora_fin' => sprintf('%02d:30', $horaInicio + 1),
            'aula' => fake()->randomElement(['Aula 101', 'Aula 102', 'Aula 201', 'Laboratorio 1', 'Auditorio']),
        ];
    }
}
