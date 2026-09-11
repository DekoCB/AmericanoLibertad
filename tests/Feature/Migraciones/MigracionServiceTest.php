<?php

namespace Tests\Feature\Migraciones;

use App\Models\Carrera;
use App\Modules\Academico\Enums\ModalidadCicloEnum;
use App\Modules\Academico\Enums\TipoCicloEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Services\CicloService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\DTOs\RegistrarEstudianteData;
use App\Modules\Matricula\DTOs\RegistrarMatriculaData;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Services\MatriculaService;
use App\Modules\Migraciones\Services\MigracionService;
use App\Shared\ValueObjects\Dni;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigracionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function service(): MigracionService
    {
        return $this->app->make(MigracionService::class);
    }

    private function cicloConPeriodoAbierto(array $atributos = []): Ciclo
    {
        $ciclo = Ciclo::factory()->activo()->create(array_merge([
            'fecha_inicio' => now()->subDays(20),
            'fecha_fin' => now()->addMonths(5),
        ], $atributos));

        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(10),
        ]);

        return $ciclo;
    }

    private function estudianteMatriculado(Ciclo $ciclo, Carrera $carrera, int $cicloCurricular = 1): Estudiante
    {
        $matriculas = $this->app->make(MatriculaService::class);

        $estudiante = $matriculas->registrarEstudiante(new RegistrarEstudianteData(
            nombres: 'Ana',
            apellidos: 'García Pérez',
            dni: new Dni((string) random_int(10000000, 99999999)),
            fechaNacimiento: now()->subYears(25)->format('Y-m-d'),
            estadoCivil: null,
            direccion: null,
            celular: null,
            observaciones: null,
        ));

        $matriculas->matricular($estudiante, new RegistrarMatriculaData($ciclo->id, $carrera->id, $cicloCurricular, null, null));

        return $estudiante;
    }

    public function test_migrar_crea_una_nueva_matricula_en_el_ciclo_y_ciclo_curricular_destino(): void
    {
        // La carrera nunca cambia en una migración -- solo el ciclo
        // curricular (I-VI) dentro de esa misma carrera (ver el docblock de
        // MigracionService).
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();

        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $origen = $estudiante->matriculas()->first();

        $destino = $this->service()->migrar($origen, $cicloDestino->id, 2, null);

        $this->assertSame($cicloDestino->id, $destino->ciclo_id);
        $this->assertSame($carrera->id, $destino->carrera_id);
        $this->assertSame(2, $destino->ciclo_curricular);
        $this->assertDatabaseCount('matriculas', 2);
    }

    public function test_migrar_masivo_procesa_varios_estudiantes_y_tolera_errores_por_fila(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();

        $estudianteA = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $estudianteB = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);

        // Este ya tiene una matrícula en el ciclo destino -- matricular()
        // debe rechazarla como duplicada, y migrarMasivo() debe tolerarlo
        // sin frenar al resto.
        $estudianteC = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $this->app->make(MatriculaService::class)->matricular($estudianteC, new RegistrarMatriculaData($cicloDestino->id, $carrera->id, 2, null, null));

        $origenes = $this->service()->matriculasVigentes(null, $cicloOrigen->id, $carrera->id, 1);
        $this->assertCount(3, $origenes);

        $resultado = $this->service()->migrarMasivo($origenes, $cicloDestino->id, 2, null);

        $this->assertSame(2, $resultado['exitosos']);
        $this->assertCount(1, $resultado['errores']);
        $this->assertSame($estudianteC->nombreCompleto(), $resultado['errores'][0]['estudiante']);
    }

    public function test_matriculas_vigentes_filtra_por_ciclo_carrera_y_ciclo_curricular(): void
    {
        $carreraA = Carrera::factory()->create();
        $carreraB = Carrera::factory()->create();
        $ciclo = $this->cicloConPeriodoAbierto();

        $this->estudianteMatriculado($ciclo, $carreraA, 1);
        $this->estudianteMatriculado($ciclo, $carreraB, 3);

        $this->assertCount(1, $this->service()->matriculasVigentes(null, $ciclo->id, $carreraA->id, null));
        $this->assertCount(1, $this->service()->matriculasVigentes(null, $ciclo->id, $carreraB->id, null));
        $this->assertCount(2, $this->service()->matriculasVigentes(null, $ciclo->id, null, null));
        $this->assertCount(1, $this->service()->matriculasVigentes(null, $ciclo->id, null, 1));
    }

    public function test_matriculas_vigentes_filtra_por_modalidad(): void
    {
        $carrera = Carrera::factory()->create();
        $cicloSeisMeses = $this->cicloConPeriodoAbierto();
        $cicloAnual = $this->cicloConPeriodoAbierto(['modalidad' => ModalidadCicloEnum::ANUAL, 'tipo' => null]);

        $this->estudianteMatriculado($cicloSeisMeses, $carrera, 1);
        $this->estudianteMatriculado($cicloAnual, $carrera, 1);

        $this->assertCount(1, $this->service()->matriculasVigentes(ModalidadCicloEnum::SEIS_MESES, null, $carrera->id, null));
        $this->assertCount(1, $this->service()->matriculasVigentes(ModalidadCicloEnum::ANUAL, null, $carrera->id, null));
        $this->assertCount(2, $this->service()->matriculasVigentes(null, null, $carrera->id, null));
    }

    public function test_ciclo_anual_vigente_devuelve_el_mas_reciente(): void
    {
        Ciclo::factory()->anual()->create(['anio' => 2025, 'fecha_inicio' => '2025-03-01', 'fecha_fin' => '2025-12-20']);
        $masReciente = Ciclo::factory()->anual()->create(['anio' => 2027, 'fecha_inicio' => '2027-03-01', 'fecha_fin' => '2027-12-20']);
        Ciclo::factory()->anual()->create(['anio' => 2026, 'fecha_inicio' => '2026-03-01', 'fecha_fin' => '2026-12-20']);

        $this->assertSame($masReciente->id, $this->service()->cicloAnualVigente()->id);
    }

    public function test_ciclo_curricular_siguiente_devuelve_el_inmediato_superior_acotado_por_la_carrera(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);

        $this->assertSame(2, $this->service()->cicloCurricularSiguiente($carrera, 1));
        $this->assertNull($this->service()->cicloCurricularSiguiente($carrera, 6));
    }

    public function test_ciclo_destino_sugerido_usa_siguiente_ciclo_para_seis_meses(): void
    {
        $actual = Ciclo::factory()->create(['tipo' => TipoCicloEnum::CICLO_1, 'anio' => 2026]);
        $siguiente = Ciclo::factory()->create(['tipo' => TipoCicloEnum::CICLO_3, 'anio' => 2026]);

        $sugerido = $this->service()->cicloDestinoSugerido($actual, $this->app->make(CicloService::class));

        $this->assertSame($siguiente->id, $sugerido->id);
    }

    public function test_ciclo_destino_sugerido_busca_el_ciclo_anual_del_anio_siguiente(): void
    {
        $actual = Ciclo::factory()->anual()->create(['anio' => 2026]);
        $siguiente = Ciclo::factory()->anual()->create(['anio' => 2027]);

        $sugerido = $this->service()->cicloDestinoSugerido($actual, $this->app->make(CicloService::class));

        $this->assertSame($siguiente->id, $sugerido->id);
    }
}
