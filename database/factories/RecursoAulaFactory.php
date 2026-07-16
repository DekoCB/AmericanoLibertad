<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\RecursoAula;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecursoAula>
 */
class RecursoAulaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tipo = fake()->randomElement(['anuncio', 'enlace', 'archivo']);

        return [
            'course_id' => Course::factory(),
            'titulo' => fake()->randomElement([
                'Bienvenida al curso', 'Material de la semana', 'Guía de práctica',
                'Grabación de la clase', 'Recordatorio de evaluación',
            ]),
            'tipo' => $tipo,
            'descripcion' => fake()->sentence(15),
            'url' => $tipo === 'anuncio' ? null : fake()->url(),
            'creado_por' => null,
        ];
    }
}
