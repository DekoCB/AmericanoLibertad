<?php

namespace Tests\Feature\Vacaciones;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\DTOs\RegistrarEstudianteData;
use App\Modules\Matricula\DTOs\RegistrarMatriculaData;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Services\MatriculaService;
use App\Shared\Enums\RolEnum;
use App\Shared\ValueObjects\Dni;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

class VacacionesPermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function estudianteMatriculado(string $dni): Estudiante
    {
        $ciclo = Ciclo::factory()->activo()->create([
            'fecha_inicio' => now()->subDays(20),
            'fecha_fin' => now()->addMonths(5),
        ]);
        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(10),
        ]);

        $matriculas = app(MatriculaService::class);
        $estudiante = $matriculas->registrarEstudiante(new RegistrarEstudianteData(
            nombres: 'Verónica',
            apellidos: 'Quispe Paredes',
            dni: new Dni($dni),
            fechaNacimiento: now()->subYears(25)->format('Y-m-d'),
            estadoCivil: null,
            direccion: null,
            celular: null,
            observaciones: null,
        ));
        $matriculas->matricular($estudiante, new RegistrarMatriculaData($ciclo->id, Carrera::factory()->create()->id, 1, null, null));

        return $estudiante;
    }

    public function test_rol_coordinador_puede_ver_vacaciones(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario)->get(route('vacaciones.index'))->assertOk();
    }

    public function test_un_docente_no_puede_ver_vacaciones(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($usuario)->get(route('vacaciones.index'))->assertForbidden();
    }

    /**
     * Las vacaciones solo aplicaban a la modalidad SIAGIE anual, que ya no
     * existe (ver VacacionService::activar()) -- el módulo quedó oculto del
     * menú y cualquier intento de registrar vacaciones debe fallar.
     */
    public function test_registrar_vacaciones_desde_la_ui_siempre_falla(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = $this->estudianteMatriculado('55667744');

        $this->actingAs($usuario);

        Volt::test('vacaciones.index')
            ->call('abrirModal')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('fechaInicio', now()->format('Y-m-d'))
            ->call('activar')
            ->assertHasErrors('estudiante')
            ->assertSet('mostrarModal', true);

        $this->assertDatabaseCount('vacaciones', 0);
    }
}
