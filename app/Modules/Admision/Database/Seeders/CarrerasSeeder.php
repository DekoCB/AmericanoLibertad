<?php

declare(strict_types=1);

namespace App\Modules\Admision\Database\Seeders;

use App\Models\Carrera;
use Illuminate\Database\Seeder;

class CarrerasSeeder extends Seeder
{
    /**
     * "Contabilidad" reemplaza a "Fisioterapia y Rehabilitación" (2026-09-11):
     * el documento oficial de currículas completas del instituto lista
     * exactamente estas 4 carreras -- Fisioterapia no aparece ahí ni en
     * ningún otro documento visto, era un dato inventado en un trabajo
     * anterior. Confirmado con el cliente que se reemplaza.
     */
    private const CARRERAS = [
        ['name' => 'Enfermería', 'code' => 'ENF'],
        ['name' => 'Farmacia', 'code' => 'FAR'],
        ['name' => 'Contabilidad', 'code' => 'CON'],
        ['name' => 'Administración', 'code' => 'ADM'],
    ];

    public function run(): void
    {
        foreach (self::CARRERAS as $carrera) {
            Carrera::query()->firstOrCreate(
                ['code' => $carrera['code']],
                [...$carrera, 'total_ciclos' => 6]
            );
        }
    }
}
