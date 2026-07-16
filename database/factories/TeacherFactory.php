<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'specialty' => fake()->randomElement([
                'Matemáticas', 'Ciencias', 'Humanidades', 'Idiomas', 'Tecnología', 'Artes',
            ]),
            'tarifa_hora' => fake()->randomElement([18, 20, 22, 25, 30]),
        ];
    }
}
