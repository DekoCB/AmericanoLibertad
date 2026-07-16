<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\RegistroHoras;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegistroHoras>
 */
class RegistroHorasFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'teacher_id' => Teacher::factory(),
            'course_id' => Course::factory(),
            'fecha' => fake()->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
            'horas_academicas' => fake()->randomElement([1.5, 2, 2.5, 3, 4]),
            'minutos_tardanza' => fake()->randomElement([0, 0, 0, 5, 10, 15]),
            'nota' => null,
            'pagado' => false,
            'egreso_id' => null,
        ];
    }
}
