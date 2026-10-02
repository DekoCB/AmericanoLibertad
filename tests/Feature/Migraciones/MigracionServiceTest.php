<?php

namespace Tests\Feature\Migraciones;

use App\Models\Carrera;
use App\Modules\Academico\Enums\TipoCicloEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Academico\Services\CicloService;
use App\Modules\Academico\Services\PeriodoService;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\DTOs\RegistrarEstudianteData;
use App\Modules\Matricula\DTOs\RegistrarMatriculaData;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Services\MatriculaService;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
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

    /**
     * Un Ciclo nacido de un Periodo real (ver PeriodoService), vinculado a
     * ese mismo Periodo en vez de crear uno nuevo vía el hook de la factory.
     */
    private function cicloDePeriodo(Periodo $periodo): Ciclo
    {
        return Ciclo::factory()->conPeriodo()->create([
            'anio' => $periodo->anio,
            'fecha_inicio' => $periodo->fecha_inicio,
            'fecha_fin' => $periodo->fecha_fin,
            'siagie_id' => $periodo->id,
        ]);
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

        $origenes = $this->service()->matriculasVigentes($cicloOrigen->id, $carrera->id, 1);
        $this->assertCount(3, $origenes);

        $resultado = $this->service()->migrarMasivo($origenes, $cicloDestino->id, 2, null);

        $this->assertSame(2, $resultado['exitosos']);
        $this->assertCount(1, $resultado['errores']);
        $this->assertSame($estudianteC->nombreCompleto(), $resultado['errores'][0]['estudiante']);
    }

    /**
     * Crea un curso+horario en $ciclo (carrera/ciclo_curricular los deriva
     * Horario solo, ver Horario::booted()) y, si se da una nota, publica
     * una calificación del estudiante ahí -- para que
     * EvaluacionService::notaLetraDelEstudiante() tenga con qué decidir.
     */
    private function cursoConNota(Carrera $carrera, int $cicloCurricular, Ciclo $ciclo, Estudiante $estudiante, ?float $nota): Horario
    {
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => $cicloCurricular]);
        $horario = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);

        if ($nota !== null) {
            $evaluaciones = $this->app->make(EvaluacionService::class);
            $evaluacion = $evaluaciones->crear($horario, 'Evaluación', now()->subDay()->format('Y-m-d'));
            $evaluaciones->calificar($evaluacion, $estudiante, $nota, null, null);
            $evaluaciones->publicar($evaluacion);
        }

        return $horario;
    }

    public function test_migrar_crea_un_refuerzo_para_un_curso_desaprobado(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $origen = $estudiante->matriculas()->first();

        $horarioDesaprobado = $this->cursoConNota($carrera, 1, $cicloOrigen, $estudiante, 8.0);

        $destino = $this->service()->migrar($origen, $cicloDestino->id, 2, null);

        $this->assertDatabaseHas('matricula_refuerzos', [
            'matricula_id' => $destino->id,
            'curso_id' => $horarioDesaprobado->curso_id,
            'matricula_origen_id' => $origen->id,
            'estado' => EstadoRefuerzoEnum::PENDIENTE->value,
        ]);
    }

    public function test_migrar_no_crea_refuerzo_para_un_curso_aprobado(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $origen = $estudiante->matriculas()->first();

        $this->cursoConNota($carrera, 1, $cicloOrigen, $estudiante, 16.0);

        $destino = $this->service()->migrar($origen, $cicloDestino->id, 2, null);

        $this->assertDatabaseCount('matricula_refuerzos', 0);
        $this->assertSame(0, $destino->refuerzos()->count());
    }

    public function test_migrar_no_crea_refuerzo_para_un_curso_sin_calificar(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $origen = $estudiante->matriculas()->first();

        $this->cursoConNota($carrera, 1, $cicloOrigen, $estudiante, null);

        $this->service()->migrar($origen, $cicloDestino->id, 2, null);

        $this->assertDatabaseCount('matricula_refuerzos', 0);
    }

    public function test_migrar_auto_asigna_seccion_si_hay_una_sola_en_el_ciclo_destino(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloOrigen = $this->cicloConPeriodoAbierto();
        $cicloDestino = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloOrigen, $carrera, 1);
        $origen = $estudiante->matriculas()->first();

        $horarioDesaprobado = $this->cursoConNota($carrera, 1, $cicloOrigen, $estudiante, 5.0);
        // La misma sección del curso jalado, ahora dictándose también en el
        // ciclo destino -- la única opción disponible ahí.
        $seccionEnDestino = Horario::factory()->create(['curso_id' => $horarioDesaprobado->curso_id, 'ciclo_id' => $cicloDestino->id]);

        $destino = $this->service()->migrar($origen, $cicloDestino->id, 2, null);

        $this->assertDatabaseHas('matricula_refuerzos', [
            'matricula_id' => $destino->id,
            'horario_id' => $seccionEnDestino->id,
            'estado' => EstadoRefuerzoEnum::CURSANDO->value,
        ]);
    }

    public function test_migrar_vuelve_a_migrar_al_que_sigue_desaprobando_el_mismo_curso(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);
        $cicloA = $this->cicloConPeriodoAbierto();
        $cicloB = $this->cicloConPeriodoAbierto();
        $cicloC = $this->cicloConPeriodoAbierto();
        $estudiante = $this->estudianteMatriculado($cicloA, $carrera, 1);
        $matriculaA = $estudiante->matriculas()->first();

        $horarioJalado = $this->cursoConNota($carrera, 1, $cicloA, $estudiante, 5.0);
        $matriculaB = $this->service()->migrar($matriculaA, $cicloB->id, 2, null);

        // El refuerzo quedó sin sección asignada (no hay otra sección de
        // ese curso en el ciclo B) -- lo calificamos igual, asignándolo a
        // mano como haría el coordinador desde Ficha de Estudiante.
        $refuerzoEnB = $matriculaB->refuerzos()->first();
        $refuerzoEnB->update(['horario_id' => $horarioJalado->id]);
        $evaluaciones = $this->app->make(EvaluacionService::class);
        $evaluacion = $evaluaciones->crear($horarioJalado, 'Segundo intento', now()->format('Y-m-d'));
        $evaluaciones->calificar($evaluacion, $estudiante, 4.0, null, null);
        $evaluaciones->publicar($evaluacion);

        $matriculaC = $this->service()->migrar($matriculaB, $cicloC->id, 3, null);

        $refuerzoEnB->refresh();
        $this->assertSame(EstadoRefuerzoEnum::DESAPROBADO, $refuerzoEnB->estado);
        $this->assertDatabaseHas('matricula_refuerzos', [
            'matricula_id' => $matriculaC->id,
            'curso_id' => $horarioJalado->curso_id,
            'matricula_origen_id' => $matriculaB->id,
        ]);
        $this->assertSame(2, MatriculaRefuerzo::where('curso_id', $horarioJalado->curso_id)->count());
    }

    public function test_matriculas_vigentes_filtra_por_ciclo_carrera_y_ciclo_curricular(): void
    {
        $carreraA = Carrera::factory()->create();
        $carreraB = Carrera::factory()->create();
        $ciclo = $this->cicloConPeriodoAbierto();

        $this->estudianteMatriculado($ciclo, $carreraA, 1);
        $this->estudianteMatriculado($ciclo, $carreraB, 3);

        $this->assertCount(1, $this->service()->matriculasVigentes($ciclo->id, $carreraA->id, null));
        $this->assertCount(1, $this->service()->matriculasVigentes($ciclo->id, $carreraB->id, null));
        $this->assertCount(2, $this->service()->matriculasVigentes($ciclo->id, null, null));
        $this->assertCount(1, $this->service()->matriculasVigentes($ciclo->id, null, 1));
    }

    public function test_ciclo_curricular_siguiente_devuelve_el_inmediato_superior_acotado_por_la_carrera(): void
    {
        $carrera = Carrera::factory()->create(['total_ciclos' => 6]);

        $this->assertSame(2, $this->service()->cicloCurricularSiguiente($carrera, 1));
        $this->assertNull($this->service()->cicloCurricularSiguiente($carrera, 6));
    }

    public function test_ciclo_destino_sugerido_usa_siguiente_ciclo_para_un_ciclo_rotativo_heredado(): void
    {
        $actual = Ciclo::factory()->create(['tipo' => TipoCicloEnum::CICLO_1, 'anio' => 2026]);
        $siguiente = Ciclo::factory()->create(['tipo' => TipoCicloEnum::CICLO_3, 'anio' => 2026]);

        $sugerido = $this->service()->cicloDestinoSugerido($actual, $this->app->make(CicloService::class), $this->app->make(PeriodoService::class));

        $this->assertSame($siguiente->id, $sugerido->id);
    }

    public function test_ciclo_destino_sugerido_usa_el_periodo_siguiente_para_un_ciclo_nacido_de_un_periodo(): void
    {
        $periodoActual = Periodo::factory()->create(['anio' => 2026]);
        $periodoSiguiente = Periodo::factory()->segundo()->create(['anio' => 2026]);
        $actual = $this->cicloDePeriodo($periodoActual);
        $siguiente = $this->cicloDePeriodo($periodoSiguiente);

        $sugerido = $this->service()->cicloDestinoSugerido($actual, $this->app->make(CicloService::class), $this->app->make(PeriodoService::class));

        $this->assertSame($siguiente->id, $sugerido->id);
    }
}
