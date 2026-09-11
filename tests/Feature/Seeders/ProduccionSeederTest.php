<?php

namespace Tests\Feature\Seeders;

use App\Models\Carrera;
use App\Models\User;
use App\Shared\Enums\RolEnum;
use Database\Seeders\ProduccionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProduccionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_siembra_los_6_roles_institucionales(): void
    {
        $this->seed(ProduccionSeeder::class);

        foreach (RolEnum::cases() as $rol) {
            $this->assertTrue(Role::query()->where('name', $rol->value)->exists(), "Falta el rol {$rol->value}");
        }
    }

    public function test_siembra_las_carreras_y_la_curricula_real(): void
    {
        $this->seed(ProduccionSeeder::class);

        $this->assertGreaterThan(0, Carrera::query()->count());
    }

    /**
     * CUENTAS_GERENCIA está vacío a propósito en este seeder (ver su propio
     * docblock): las cuentas reales de CEBA se quitaron al adaptar el
     * proyecto para Americano Libertad, pendiente de completarse con datos
     * reales antes del primer despliegue. Mientras siga vacío, sembrar no
     * debe crear ninguna cuenta.
     */
    public function test_no_crea_ninguna_cuenta_mientras_la_lista_de_gerencia_este_vacia(): void
    {
        $this->seed(ProduccionSeeder::class);

        $this->assertSame(0, User::query()->count());
    }

    public function test_correrlo_dos_veces_no_falla_ni_duplica_nada(): void
    {
        $this->seed(ProduccionSeeder::class);
        $this->seed(ProduccionSeeder::class);

        $this->assertSame(0, User::query()->count());
        $this->assertSame(count(RolEnum::cases()), Role::query()->count());
    }
}
