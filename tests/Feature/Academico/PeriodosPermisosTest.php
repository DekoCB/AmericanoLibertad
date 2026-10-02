<?php

namespace Tests\Feature\Academico;

use App\Models\User;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

class PeriodosPermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_coordinador_puede_ver_el_modulo_periodos(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador)
            ->get(route('academico.periodos.index'))
            ->assertOk();
    }

    public function test_docente_no_puede_ver_el_modulo_periodos(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get(route('academico.periodos.index'))
            ->assertForbidden();
    }

    public function test_crear_un_periodo_crea_ademas_su_ciclo_vinculado(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador);

        Volt::test('academico.periodos.index')
            ->set('tipo', TipoPeriodoEnum::PRIMERO->value)
            ->set('anio', '2026')
            ->set('fechaInicio', '2026-01-01')
            ->set('fechaFin', '2026-06-30')
            ->call('guardar')
            ->assertHasNoErrors();

        $periodo = Periodo::query()->where('anio', 2026)->where('tipo', 'primero')->firstOrFail();
        $ciclo = Ciclo::query()->where('siagie_id', $periodo->id)->first();

        $this->assertNotNull($ciclo);
        $this->assertSame('Periodo 2026-1', $ciclo->nombre);
        $this->assertNull($ciclo->tipo);
    }

    public function test_crear_un_periodo_sin_fechas_falla(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador);

        Volt::test('academico.periodos.index')
            ->set('tipo', TipoPeriodoEnum::PRIMERO->value)
            ->set('anio', '2026')
            ->call('guardar')
            ->assertHasErrors(['fechaInicio']);
    }

    public function test_el_listado_muestra_los_periodos_disponibles(): void
    {
        Periodo::factory()->create(['tipo' => TipoPeriodoEnum::PRIMERO, 'anio' => 2026]);
        Periodo::factory()->segundo()->create(['tipo' => TipoPeriodoEnum::SEGUNDO, 'anio' => 2026]);

        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $this->actingAs($coordinador);

        Volt::test('academico.periodos.index')
            ->assertSee('2026-1')
            ->assertSee('2026-2');
    }

    public function test_no_permite_dos_periodos_del_mismo_tipo_y_anio(): void
    {
        Periodo::factory()->create(['tipo' => TipoPeriodoEnum::PRIMERO, 'anio' => 2026]);

        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $this->actingAs($coordinador);

        Volt::test('academico.periodos.index')
            ->set('tipo', TipoPeriodoEnum::PRIMERO->value)
            ->set('anio', '2026')
            ->call('guardar')
            ->assertHasErrors();
    }
}
