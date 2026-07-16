<?php

namespace Database\Factories;

use App\Models\Egreso;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Egreso>
 */
class EgresoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'concepto' => fake()->randomElement([
                'Pago docente', 'Servicios de limpieza', 'Internet y telefonía',
                'Mantenimiento de equipos', 'Papelería y útiles de oficina',
            ]),
            'categoria' => fake()->randomElement(['pago_docente', 'operativo', 'otro']),
            'monto' => fake()->randomFloat(2, 50, 2000),
            'fecha' => fake()->dateTimeBetween('-3 months', 'now'),
            'registrado_por' => null,
        ];
    }
}
