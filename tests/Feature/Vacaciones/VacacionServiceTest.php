<?php

namespace Tests\Feature\Vacaciones;

use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Vacaciones\Models\Vacacion;
use App\Modules\Vacaciones\Services\VacacionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class VacacionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function service(): VacacionService
    {
        return $this->app->make(VacacionService::class);
    }

    /**
     * La modalidad SIAGIE anual -- la única a la que aplicaban las
     * vacaciones -- se retiró (ver VacacionService::activar()): ya no hay
     * ningún estudiante al que puedan activársele, sea cual sea su
     * matrícula.
     */
    public function test_activar_siempre_rechaza_la_solicitud(): void
    {
        $estudiante = Estudiante::factory()->create();

        $this->expectException(ValidationException::class);

        $this->service()->activar($estudiante, now()->format('Y-m-d'), null);
    }

    public function test_vigentes_y_historial_particionan_por_fecha_fin(): void
    {
        $enVacaciones = Vacacion::factory()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(50),
        ]);
        $yaTermino = Vacacion::factory()->create([
            'fecha_inicio' => now()->subMonths(4),
            'fecha_fin' => now()->subMonths(2),
        ]);

        $vigentes = $this->service()->vigentes();
        $historial = $this->service()->historial();

        $this->assertCount(1, $vigentes);
        $this->assertSame($enVacaciones->id, $vigentes->first()->id);
        $this->assertCount(1, $historial);
        $this->assertSame($yaTermino->id, $historial->first()->id);
    }
}
