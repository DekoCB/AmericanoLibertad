<?php

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Matemáticas', 'Lengua y Literatura', 'Ciencias Naturales', 'Historia',
                'Geografía', 'Inglés', 'Educación Física', 'Arte', 'Física', 'Química',
                'Biología', 'Programación', 'Filosofía',
            ]),
            'code' => strtoupper(fake()->unique()->bothify('???-###')),
            'description' => fake()->sentence(12),
            'credit_hours' => fake()->numberBetween(2, 6),
        ];
    }
}
