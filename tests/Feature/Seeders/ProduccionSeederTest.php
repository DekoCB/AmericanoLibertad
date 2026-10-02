<?php

namespace Tests\Feature\Seeders;

use App\Models\Carrera;
use App\Models\User;
use App\Shared\Enums\RolEnum;
use Database\Seeders\ProduccionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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

    public function test_crea_la_cuenta_admin_con_sus_roles_y_contrasena_fija(): void
    {
        $this->seed(ProduccionSeeder::class);

        $admin = User::query()->where('email', 'admin@gmail.com')->first();

        $this->assertNotNull($admin);
        $this->assertSame('71586559', $admin->dni);
        $this->assertTrue($admin->hasRole(RolEnum::ADMINISTRATIVO->value));
        $this->assertTrue($admin->hasRole(RolEnum::GERENCIA->value));
        $this->assertTrue(Hash::check('admin123', $admin->password));
    }

    public function test_crea_la_cuenta_del_director_sin_dni_y_solo_con_rol_gerencia(): void
    {
        $this->seed(ProduccionSeeder::class);

        $director = User::query()->where('email', 'donaldyovera@gmail.com')->first();

        $this->assertNotNull($director);
        $this->assertNull($director->dni);
        $this->assertTrue($director->hasRole(RolEnum::GERENCIA->value));
        $this->assertFalse($director->hasRole(RolEnum::ADMINISTRATIVO->value));
        $this->assertTrue(Hash::check('AmericaLib123', $director->password));
    }

    public function test_correrlo_dos_veces_no_falla_ni_duplica_nada(): void
    {
        $this->seed(ProduccionSeeder::class);
        $this->seed(ProduccionSeeder::class);

        $this->assertSame(2, User::query()->count());
        $this->assertSame(count(RolEnum::cases()), Role::query()->count());
    }
}
