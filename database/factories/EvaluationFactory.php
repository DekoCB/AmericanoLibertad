<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evaluation>
 */
class EvaluationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'name' => fake()->randomElement([
                'Primer parcial', 'Segundo parcial', 'Examen final', 'Quiz de repaso',
                'Tarea de investigación', 'Proyecto final',
            ]),
            'type' => fake()->randomElement(['exam', 'quiz', 'homework', 'project']),
            'weight' => fake()->randomElement([10, 15, 20, 25, 30]),
            'date' => fake()->dateTimeBetween('-4 months', '+1 month'),
            'max_score' => 100,
        ];
    }
}
