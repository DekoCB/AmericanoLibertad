<?php

namespace Tests\Feature\Asistencia;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

/**
 * El drill-down de Asistencia ya no es Grupo -> Sección(A/B) -> Grado ->
 * Curso (la sección A/B por grado fue retirada, "aulas libres, sin sección
 * fija") sino Grupo(ciclo) -> Carrera -> Ciclo curricular (I-VI) -> Curso.
 */
class AsistenciaSeccionesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_elegir_un_ciclo_ofrece_las_carreras_con_horarios_antes_de_los_cursos(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carreraA = Carrera::factory()->create(['name' => 'Enfermería Técnica']);
        $carreraB = Carrera::factory()->create(['name' => 'Farmacia Técnica']);
        $cursoA = Curso::factory()->create(['carrera_id' => $carreraA->id, 'ciclo_curricular' => 1]);
        $cursoB = Curso::factory()->create(['carrera_id' => $carreraB->id, 'ciclo_curricular' => 1]);
        Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $cursoA->id]);
        Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $cursoB->id]);

        $this->actingAs($usuario);

        Volt::test('asistencia.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->assertSee('Enfermería Técnica')
            ->assertSee('Farmacia Técnica')
            ->assertSet('carreraId', null);
    }

    public function test_elegir_una_carrera_ofrece_sus_ciclos_curriculares(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carrera = Carrera::factory()->create();
        $cursoUno = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $cursoDos = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 2]);
        Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $cursoUno->id]);
        Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $cursoDos->id]);

        $this->actingAs($usuario);

        Volt::test('asistencia.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->assertSee('Ciclo 1')
            ->assertSee('Ciclo 2');
    }

    public function test_elegir_un_ciclo_curricular_muestra_su_horario(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carrera = Carrera::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $curso->id]);

        $this->actingAs($usuario);

        Volt::test('asistencia.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->call('seleccionarCicloCurricular', 1)
            ->assertSee($horario->curso->nombre);
    }

    public function test_volver_a_carreras_limpia_el_ciclo_curricular_elegido(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carrera = Carrera::factory()->create(['name' => 'Enfermería Técnica']);
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $curso->id]);

        $this->actingAs($usuario);

        Volt::test('asistencia.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->call('seleccionarCicloCurricular', 1)
            ->call('volverACarreras')
            ->assertSet('cicloCurricular', null)
            ->assertSee('Enfermería Técnica');
    }
}
