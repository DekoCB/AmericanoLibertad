<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'teacher_id' => Teacher::factory(),
            'name' => 'Sección ' . fake()->randomLetter(),
            'period' => fake()->randomElement(['2026-1', '2026-2']),
            'schedule' => fake()->randomElement([
                'Lun-Mié 08:00-09:30', 'Mar-Jue 10:00-11:30', 'Vie 13:00-16:00',
            ]),
            'turno' => fake()->randomElement(['mañana', 'tarde', 'noche']),
            'capacity' => fake()->numberBetween(20, 40),
        ];
    }
}
