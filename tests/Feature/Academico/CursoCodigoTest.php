<?php

namespace Tests\Feature\Academico;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Services\CursoService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

class CursoCodigoTest extends TestCase
{
    use RefreshDatabase;

    private function service(): CursoService
    {
        return $this->app->make(CursoService::class);
    }

    public function test_genera_el_codigo_con_el_codigo_de_carrera_el_ciclo_en_romano_y_la_secuencia(): void
    {
        $carrera = Carrera::factory()->create(['code' => 'ENF']);

        $codigo = $this->service()->generarCodigo($carrera, 1);

        $this->assertSame('ENF-I-01', $codigo);
    }

    public function test_cada_ciclo_lleva_su_propia_secuencia_dentro_de_la_misma_carrera(): void
    {
        $carrera = Carrera::factory()->create(['code' => 'ENF']);
        Curso::factory()->create(['codigo' => 'ENF-I-01', 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);

        $codigo = $this->service()->generarCodigo($carrera, 3);

        $this->assertSame('ENF-III-01', $codigo);
    }

    public function test_agrega_la_siguiente_secuencia_si_el_codigo_base_ya_existe(): void
    {
        $carrera = Carrera::factory()->create(['code' => 'ENF']);
        Curso::factory()->create(['codigo' => 'ENF-I-01', 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);

        $codigo = $this->service()->generarCodigo($carrera, 1);

        $this->assertSame('ENF-I-02', $codigo);
    }

    public function test_crear_un_curso_desde_el_formulario_le_asigna_codigo_automaticamente(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $carrera = Carrera::factory()->create(['code' => 'FAR']);

        $this->actingAs($coordinador);

        Volt::test('academico.cursos.index')
            ->call('abrirModal')
            ->set('nombre', 'Farmacología General')
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '2')
            ->set('horas', '80')
            ->call('guardar')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('cursos', [
            'nombre' => 'Farmacología General',
            'codigo' => 'FAR-II-01',
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 2,
        ]);
    }

    public function test_editar_un_curso_no_le_cambia_el_codigo_al_ajustar_nombre_o_carrera(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $carreraOriginal = Carrera::factory()->create(['code' => 'ENF']);
        $otraCarrera = Carrera::factory()->create(['code' => 'ADM']);
        $curso = Curso::factory()->create([
            'nombre' => 'Anatomía Funcional',
            'codigo' => 'ENF-I-01',
            'carrera_id' => $carreraOriginal->id,
            'ciclo_curricular' => 1,
        ]);

        $this->actingAs($coordinador);

        Volt::test('academico.cursos.index')
            ->call('abrirModal', $curso->id)
            ->set('nombre', 'Anatomía Funcional Avanzada')
            ->set('carreraId', (string) $otraCarrera->id)
            ->call('guardar')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('cursos', [
            'id' => $curso->id,
            'nombre' => 'Anatomía Funcional Avanzada',
            'codigo' => 'ENF-I-01',
            'carrera_id' => $otraCarrera->id,
        ]);
    }
}
