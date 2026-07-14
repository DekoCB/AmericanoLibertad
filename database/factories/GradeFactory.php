<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'student_id' => Student::factory(),
            'score' => fake()->randomFloat(2, 40, 100),
            'comments' => fake()->optional()->sentence(),
        ];
    }
}
