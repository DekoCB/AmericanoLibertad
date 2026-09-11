<?php

namespace Tests\Feature\AulaVirtual;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\AulaVirtual\Models\CursoVirtual;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

/**
 * El drill-down de Aula Virtual ya no es Grupo -> Sección(A/B) -> Grado ->
 * Curso (la sección A/B por grado fue retirada, "aulas libres, sin sección
 * fija") sino Grupo(ciclo) -> Carrera -> Ciclo curricular (I-VI) -> Curso.
 */
class AulaVirtualSeccionesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function cursoVirtualDe(Ciclo $ciclo, Curso $curso): CursoVirtual
    {
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id, 'curso_id' => $curso->id]);

        return CursoVirtual::factory()->create(['horario_id' => $horario->id]);
    }

    public function test_elegir_un_ciclo_ofrece_las_carreras_con_cursos_virtuales_antes_de_los_cursos(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carreraA = Carrera::factory()->create(['name' => 'Enfermería Técnica']);
        $carreraB = Carrera::factory()->create(['name' => 'Farmacia Técnica']);
        $cursoA = Curso::factory()->create(['carrera_id' => $carreraA->id, 'ciclo_curricular' => 1]);
        $cursoB = Curso::factory()->create(['carrera_id' => $carreraB->id, 'ciclo_curricular' => 1]);
        $this->cursoVirtualDe($ciclo, $cursoA);
        $this->cursoVirtualDe($ciclo, $cursoB);

        $this->actingAs($usuario);

        Volt::test('aula-virtual.index')
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
        $this->cursoVirtualDe($ciclo, $cursoUno);
        $this->cursoVirtualDe($ciclo, $cursoDos);

        $this->actingAs($usuario);

        Volt::test('aula-virtual.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->assertSee('Ciclo 1')
            ->assertSee('Ciclo 2');
    }

    public function test_elegir_un_ciclo_curricular_muestra_su_curso_virtual(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carrera = Carrera::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $cursoVirtual = $this->cursoVirtualDe($ciclo, $curso);

        $this->actingAs($usuario);

        Volt::test('aula-virtual.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->call('seleccionarCicloCurricular', 1)
            ->assertSee($cursoVirtual->horario->curso->nombre);
    }

    public function test_volver_a_carreras_limpia_el_ciclo_curricular_elegido(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->create();
        $carrera = Carrera::factory()->create(['name' => 'Enfermería Técnica']);
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $this->cursoVirtualDe($ciclo, $curso);

        $this->actingAs($usuario);

        Volt::test('aula-virtual.index')
            ->call('seleccionarGrupo', $ciclo->id)
            ->call('seleccionarCarrera', $carrera->id)
            ->call('seleccionarCicloCurricular', 1)
            ->call('volverACarreras')
            ->assertSet('cicloCurricular', null)
            ->assertSee('Enfermería Técnica');
    }
}
