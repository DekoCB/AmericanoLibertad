<?php

namespace Database\Factories;

use App\Models\Cuota;
use App\Models\Pago;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pago>
 */
class PagoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $monto = fake()->randomFloat(2, 20, 150);

        return [
            'cuota_id' => Cuota::factory(),
            'student_id' => Student::factory(),
            'registrado_por' => null,
            'monto' => $monto,
            'medio' => 'efectivo',
            'monto_efectivo' => $monto,
            'monto_yape' => 0,
            'fecha' => fake()->dateTimeBetween('-2 months', 'now'),
            'nota' => null,
        ];
    }
}
