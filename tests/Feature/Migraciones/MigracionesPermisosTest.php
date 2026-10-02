<?php

namespace Tests\Feature\Migraciones;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Evaluaciones\Services\EvaluacionService;
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

class MigracionesPermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function cicloConPeriodoAbierto(): Ciclo
    {
        $ciclo = Ciclo::factory()->activo()->create([
            'fecha_inicio' => now()->subDays(20),
            'fecha_fin' => now()->addMonths(5),
        ]);

        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(10),
        ]);

        return $ciclo;
    }

    /**
     * Un Ciclo nacido de un Periodo real (ver PeriodoService), con su
     * propio periodo de matrícula ya abierto.
     */
    private function cicloDePeriodo(Periodo $periodo): Ciclo
    {
        $ciclo = Ciclo::factory()->conPeriodo()->activo()->create([
            'anio' => $periodo->anio,
            'fecha_inicio' => now()->subDays(20),
            'fecha_fin' => now()->addMonths(5),
            'siagie_id' => $periodo->id,
        ]);

        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(10),
        ]);

        return $ciclo;
    }

    private function estudianteMatriculado(Ciclo $ciclo, Carrera $carrera, int $cicloCurricular, string $dni): Estudiante
    {
        $matriculas = $this->app->make(MatriculaService::class);

        $estudiante = $matriculas->registrarEstudiante(new RegistrarEstudianteData(
            nombres: 'Diego',
            apellidos: 'Torres Huamán',
            dni: new Dni($dni),
            fechaNacimiento: now()->subYears(25)->format('Y-m-d'),
            estadoCivil: null,
            direccion: null,
            celular: null,
            observaciones: null,
        ));

        $matriculas->matricular($estudiante, new RegistrarMatriculaData($ciclo->id, $carrera->id, $cicloCurricular, null, null));

        return $estudiante;
    }

    public function test_rol_coordinador_puede_ver_migraciones(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario)->get(route('migraciones.index'))->assertOk();
    }

    public function test_un_docente_no_puede_ver_migraciones(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($usuario)->get(route('migraciones.index'))->assertForbidden();
    }

    public function test_migrar_un_estudiante_individualmente_crea_la_nueva_matricula(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1, '55667711');

        $this->actingAs($usuario);

        Volt::test('migraciones.index')
            ->set('terminoBusqueda', 'Torres Huamán')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('cicloDestinoId', (string) $cicloDestino->id)
            ->set('cicloCurricularDestino', '2')
            ->call('migrarIndividual')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('matriculas', [
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $cicloDestino->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 2,
        ]);
    }

    public function test_la_vista_previa_individual_muestra_el_curso_que_se_repetiria(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1, '55667744');

        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'nombre' => 'Farmacología']);
        $horario = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $cicloOrigen->id]);
        $evaluaciones = $this->app->make(EvaluacionService::class);
        $evaluacion = $evaluaciones->crear($horario, 'Evaluación', now()->format('Y-m-d'));
        $evaluaciones->calificar($evaluacion, $estudiante, 6.0, null, null);
        $evaluaciones->publicar($evaluacion);

        $this->actingAs($usuario);

        Volt::test('migraciones.index')
            ->set('terminoBusqueda', 'Torres Huamán')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertSee('1 para repetir')
            ->assertSee('Farmacología (ciclo I)');
    }

    public function test_migrar_de_forma_masiva_reporta_el_resultado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $periodoOrigen = Periodo::factory()->create(['anio' => 2030]);
        $cicloOrigen = $this->cicloDePeriodo($periodoOrigen);
        $periodoDestino = Periodo::factory()->segundo()->create(['anio' => 2030]);
        $cicloDestino = $this->cicloDePeriodo($periodoDestino);
        $this->estudianteMatriculado($cicloOrigen, $carrera, 1, '55667722');
        $this->estudianteMatriculado($cicloOrigen, $carrera, 1, '55667733');

        $this->actingAs($usuario);

        Volt::test('migraciones.index')
            ->set('tab', 'masivo')
            ->set('periodoOrigenId', (string) $periodoOrigen->id)
            ->set('carreraOrigenId', (string) $carrera->id)
            ->set('cicloCurricularOrigen', '1')
            ->set('masivoCicloDestinoId', (string) $cicloDestino->id)
            ->set('masivoCicloCurricularDestino', '2')
            ->call('migrarMasivo')
            ->assertHasNoErrors()
            ->assertSet('resultado.exitosos', 2);

        $this->assertDatabaseCount('matriculas', 4);
    }

    public function test_migrar_de_forma_masiva_sugiere_automaticamente_el_ciclo_destino_del_periodo_siguiente(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $periodoOrigen = Periodo::factory()->create(['anio' => 2031]);
        $cicloOrigen = $this->cicloDePeriodo($periodoOrigen);
        $periodoDestino = Periodo::factory()->segundo()->create(['anio' => 2031]);
        $cicloDestino = $this->cicloDePeriodo($periodoDestino);
        $this->estudianteMatriculado($cicloOrigen, $carrera, 1, '55667755');

        $this->actingAs($usuario);

        Volt::test('migraciones.index')
            ->set('tab', 'masivo')
            ->set('periodoOrigenId', (string) $periodoOrigen->id)
            ->assertSee($periodoOrigen->nombreCompleto())
            ->set('carreraOrigenId', (string) $carrera->id)
            ->set('cicloCurricularOrigen', '1')
            ->assertSet('masivoCicloDestinoId', (string) $cicloDestino->id)
            ->set('masivoCicloCurricularDestino', '2')
            ->call('migrarMasivo')
            ->assertHasNoErrors()
            ->assertSet('resultado.exitosos', 1);

        $this->assertDatabaseHas('matriculas', [
            'ciclo_id' => $cicloDestino->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 2,
        ]);
    }
}
