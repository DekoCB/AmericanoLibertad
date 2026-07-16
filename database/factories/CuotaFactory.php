<?php

namespace Database\Factories;

use App\Models\Cuota;
use App\Models\Matricula;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cuota>
 */
class CuotaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'matricula_id' => Matricula::factory(),
            'tipo' => 'matricula',
            'mes' => null,
            'monto_programado' => 50,
            'monto_pagado' => 0,
            'fecha_vencimiento' => fake()->dateTimeBetween('now', '+1 month'),
            'estado' => 'pendiente',
        ];
    }
}
