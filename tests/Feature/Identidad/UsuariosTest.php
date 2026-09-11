<?php

namespace Tests\Feature\Identidad;

use App\Models\User;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Livewire\Volt\Volt;
use Tests\TestCase;

class UsuariosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_gerencia_puede_ver_el_listado_de_usuarios(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->actingAs($gerencia)
            ->get('/usuarios')
            ->assertOk()
            ->assertSeeVolt('usuarios.index');
    }

    public function test_un_docente_no_puede_ver_el_listado_de_usuarios(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get('/usuarios')
            ->assertForbidden();
    }

    public function test_gerencia_puede_crear_un_usuario_con_rol(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->actingAs($gerencia);

        Volt::test('usuarios.index')
            ->set('name', 'Nueva Docente')
            ->set('dni', '87654321')
            ->set('phone', '987654321')
            ->set('password', 'password123')
            ->set('rol', RolEnum::DOCENTE->value)
            ->call('crear')
            ->assertHasNoErrors();

        $creado = User::query()->where('email', '87654321@ceba.test')->first();

        $this->assertNotNull($creado);
        $this->assertTrue($creado->hasRole(RolEnum::DOCENTE->value));
    }

    public function test_no_permite_crear_dos_usuarios_con_el_mismo_dni(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        User::factory()->create(['dni' => '11223344']);

        $this->actingAs($gerencia);

        Volt::test('usuarios.index')
            ->set('name', 'Otro Usuario')
            ->set('dni', '11223344')
            ->set('password', 'password123')
            ->set('rol', RolEnum::DOCENTE->value)
            ->call('crear')
            ->assertHasErrors('dni');
    }

    public function test_los_estudiantes_no_aparecen_en_el_listado_de_usuarios(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $estudiante = User::factory()->create(['name' => 'Estudiante Oculto']);
        $estudiante->assignRole(RolEnum::ESTUDIANTE->value);

        $this->actingAs($gerencia)
            ->get('/usuarios')
            ->assertOk()
            ->assertDontSee('Estudiante Oculto');
    }

    public function test_el_selector_de_rol_no_ofrece_estudiante(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->actingAs($gerencia);

        $componente = Volt::test('usuarios.index');

        $roles = collect($componente->get('rolesDisponibles'))->pluck('value');

        $this->assertFalse($roles->contains(RolEnum::ESTUDIANTE->value));
    }

    public function test_no_permite_crear_un_usuario_con_rol_estudiante_desde_este_formulario(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->actingAs($gerencia);

        Volt::test('usuarios.index')
            ->set('name', 'Intento Estudiante')
            ->set('dni', '99887766')
            ->set('password', 'password123')
            ->set('rol', RolEnum::ESTUDIANTE->value)
            ->call('crear')
            ->assertHasErrors('rol');
    }

    public function test_desactivar_un_usuario_desde_su_ficha_revoca_sus_sesiones_activas(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $docente = User::factory()->create(['dni' => '55667788']);
        $docente->assignRole(RolEnum::DOCENTE->value);

        DB::table('sessions')->insert([
            'id' => 'sesion-de-prueba',
            'user_id' => $docente->id,
            'payload' => base64_encode('datos'),
            'last_activity' => now()->timestamp,
        ]);

        $this->actingAs($gerencia);

        Volt::test('usuarios.show', ['usuario' => $docente])
            ->set('estado', 'inactivo')
            ->call('guardarDatos')
            ->assertHasNoErrors();

        $this->assertDatabaseMissing('sessions', ['id' => 'sesion-de-prueba']);
        $this->assertSame('inactivo', $docente->fresh()->estado->value);
    }
}
