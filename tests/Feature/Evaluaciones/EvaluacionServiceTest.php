<?php

namespace Tests\Feature\Evaluaciones;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\NotaLetraEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use App\Modules\Notificaciones\Models\Notificacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvaluacionServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): EvaluacionService
    {
        return $this->app->make(EvaluacionService::class);
    }

    /**
     * Siembra el examen y crea $continuas evaluaciones continuas en una
     * mitad del horario, calificando TODO (continuas + examen) con la
     * misma nota -- así su promedio queda exactamente en ese valor, sin
     * importar cuántas continuas haya (ver EvaluacionService::promedioMitad()).
     */
    private function calificarMitad(Horario $horario, Estudiante $estudiante, MitadCicloEnum $mitad, float $nota, int $continuas = 4): void
    {
        $service = $this->service();
        $service->sembrarExamenes($horario);

        $examen = $service->examenDeLaMitad($horario, $mitad);
        $service->calificar($examen, $estudiante, $nota, null, null);

        for ($i = 0; $i < $continuas; $i++) {
            $continua = $service->crearContinua($horario, $mitad, null, '2026-07-15');
            $service->calificar($continua, $estudiante, $nota, null, null);
        }
    }

    public function test_estudiantes_del_horario_solo_incluye_matriculados_aprobados(): void
    {
        $horario = Horario::factory()->create();

        $matriculado = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $matriculado->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $noMatriculado = Estudiante::factory()->create();

        $estudiantes = $this->service()->estudiantesDelHorario($horario);

        $this->assertTrue($estudiantes->contains('id', $matriculado->id));
        $this->assertFalse($estudiantes->contains('id', $noMatriculado->id));
    }

    public function test_estudiantes_del_horario_incluye_a_todos_los_matriculados_de_la_misma_carrera_y_ciclo(): void
    {
        $carrera = Carrera::factory()->create();
        $ciclo = Ciclo::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioA = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);
        $otraCarrera = Carrera::factory()->create();
        $otroCurso = Curso::factory()->create(['carrera_id' => $otraCarrera->id, 'ciclo_curricular' => 1]);
        Horario::factory()->create(['curso_id' => $otroCurso->id, 'ciclo_id' => $ciclo->id]);

        $estudianteDeLaCarrera = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudianteDeLaCarrera->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $estudianteDeOtraCarrera = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudianteDeOtraCarrera->id,
            'carrera_id' => $otraCarrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $estudiantesDeA = $this->service()->estudiantesDelHorario($horarioA);

        $this->assertTrue($estudiantesDeA->contains('id', $estudianteDeLaCarrera->id));
        $this->assertFalse($estudiantesDeA->contains('id', $estudianteDeOtraCarrera->id));
    }

    public function test_estudiantes_del_horario_incluye_matriculas_sin_horario_asignado_explicitamente(): void
    {
        $carrera = Carrera::factory()->create();
        $ciclo = Ciclo::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioA = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);

        $estudianteSinHorario = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudianteSinHorario->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $estudiantesDeA = $this->service()->estudiantesDelHorario($horarioA);

        $this->assertTrue($estudiantesDeA->contains('id', $estudianteSinHorario->id));
    }

    public function test_horarios_del_estudiante_incluye_todos_los_horarios_de_su_carrera_y_ciclo(): void
    {
        $carrera = Carrera::factory()->create();
        $ciclo = Ciclo::factory()->create();
        $cursoComunicacion = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $cursoMatematica = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioComunicacion = Horario::factory()->create(['curso_id' => $cursoComunicacion->id, 'ciclo_id' => $ciclo->id]);
        $horarioMatematica = Horario::factory()->create(['curso_id' => $cursoMatematica->id, 'ciclo_id' => $ciclo->id]);
        $otraCarrera = Carrera::factory()->create();
        $otroCurso = Curso::factory()->create(['carrera_id' => $otraCarrera->id, 'ciclo_curricular' => 1]);
        $horarioDeOtraCarrera = Horario::factory()->create(['curso_id' => $otroCurso->id, 'ciclo_id' => $ciclo->id]);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $horarios = $this->service()->horariosDelEstudiante($estudiante);

        $this->assertTrue($horarios->contains('id', $horarioComunicacion->id));
        $this->assertTrue($horarios->contains('id', $horarioMatematica->id));
        $this->assertFalse($horarios->contains('id', $horarioDeOtraCarrera->id));
    }

    public function test_horarios_del_estudiante_incluye_un_curso_en_recuperacion_de_otro_ciclo_curricular(): void
    {
        $carrera = Carrera::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 2,
        ]);

        // Un curso de ciclo_curricular 1 (uno menos que la matrícula) que
        // el estudiante está repitiendo -- jamás calzaría con
        // scopeDeLaMatricula() de esta matrícula.
        $cursoJalado = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioDeRefuerzo = Horario::factory()->create(['curso_id' => $cursoJalado->id]);
        MatriculaRefuerzo::factory()->create([
            'matricula_id' => $matricula->id,
            'curso_id' => $cursoJalado->id,
            'horario_id' => $horarioDeRefuerzo->id,
            'estado' => EstadoRefuerzoEnum::CURSANDO,
        ]);

        $horarios = $this->service()->horariosDelEstudiante($estudiante);

        $this->assertTrue($horarios->contains('id', $horarioDeRefuerzo->id));
    }

    public function test_estudiantes_del_horario_incluye_a_quien_lo_tiene_como_curso_en_recuperacion(): void
    {
        $horarioDeRefuerzo = Horario::factory()->create();
        $matricula = Matricula::factory()->create();
        MatriculaRefuerzo::factory()->create([
            'matricula_id' => $matricula->id,
            'curso_id' => $horarioDeRefuerzo->curso_id,
            'horario_id' => $horarioDeRefuerzo->id,
            'estado' => EstadoRefuerzoEnum::CURSANDO,
        ]);

        $estudiantes = $this->service()->estudiantesDelHorario($horarioDeRefuerzo);

        $this->assertTrue($estudiantes->contains('id', $matricula->estudiante_id));
    }

    public function test_horarios_del_estudiante_sin_asignacion_explicita_incluye_todos_los_horarios_de_la_carrera(): void
    {
        $carrera = Carrera::factory()->create();
        $ciclo = Ciclo::factory()->create();
        $cursoA = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $cursoB = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioA = Horario::factory()->create(['curso_id' => $cursoA->id, 'ciclo_id' => $ciclo->id]);
        $horarioB = Horario::factory()->create(['curso_id' => $cursoB->id, 'ciclo_id' => $ciclo->id]);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $horarios = $this->service()->horariosDelEstudiante($estudiante);

        $this->assertTrue($horarios->contains('id', $horarioA->id));
        $this->assertTrue($horarios->contains('id', $horarioB->id));
    }

    /**
     * Cuando el MISMO curso tiene dos secciones (dos Horario con igual
     * curso_id+carrera_id+ciclo_curricular+ciclo_id), cada estudiante debe
     * aparecer solo en la sección que se le asignó explícitamente, no en
     * ambas.
     */
    public function test_estudiantes_del_horario_con_secciones_paralelas_solo_incluye_a_quien_fue_asignado_a_esa_seccion(): void
    {
        $carrera = Carrera::factory()->create();
        $ciclo = Ciclo::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);

        $seccionA = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);
        $seccionB = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);

        $estudianteA = Estudiante::factory()->create();
        $matriculaA = Matricula::factory()->create(['estudiante_id' => $estudianteA->id, 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'ciclo_id' => $ciclo->id]);
        $matriculaA->horarios()->attach($seccionA->id);

        $estudianteB = Estudiante::factory()->create();
        $matriculaB = Matricula::factory()->create(['estudiante_id' => $estudianteB->id, 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'ciclo_id' => $ciclo->id]);
        $matriculaB->horarios()->attach($seccionB->id);

        $rosterSeccionA = $this->service()->estudiantesDelHorario($seccionA);

        $this->assertTrue($rosterSeccionA->contains('id', $estudianteA->id));
        $this->assertFalse($rosterSeccionA->contains('id', $estudianteB->id));
    }

    public function test_sembrar_examenes_crea_el_examen_de_cada_mitad(): void
    {
        $horario = Horario::factory()->create();

        $this->service()->sembrarExamenes($horario);

        $this->assertDatabaseCount('evaluaciones', 2);
        foreach (MitadCicloEnum::cases() as $mitad) {
            $this->assertDatabaseHas('evaluaciones', [
                'horario_id' => $horario->id,
                'mitad' => $mitad->value,
                'tipo' => TipoEvaluacionEnum::EXAMEN->value,
            ]);
        }
    }

    public function test_sembrar_examenes_es_idempotente(): void
    {
        $horario = Horario::factory()->create();

        $this->service()->sembrarExamenes($horario);
        $this->service()->sembrarExamenes($horario);

        $this->assertDatabaseCount('evaluaciones', 2);
    }

    public function test_sembrar_examenes_nace_en_estado_borrador(): void
    {
        $horario = Horario::factory()->create();

        $this->service()->sembrarExamenes($horario);

        $this->assertSame(0, Evaluacion::query()->where('estado', EstadoEvaluacionEnum::PUBLICADA)->count());
    }

    public function test_crear_continua_autonumera_sin_nombre(): void
    {
        $horario = Horario::factory()->create();
        $service = $this->service();

        $c1 = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $c2 = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-16');
        $c3 = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-17');

        $this->assertSame('C1', $c1->nombre());
        $this->assertSame('C2', $c2->nombre());
        $this->assertSame('C3', $c3->nombre());
    }

    public function test_crear_continua_respeta_un_nombre_personalizado(): void
    {
        $horario = Horario::factory()->create();

        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, 'Trabajo en grupo', '2026-07-15');

        $this->assertSame('Trabajo en grupo', $continua->nombre());
    }

    public function test_crear_continua_queda_en_estado_borrador(): void
    {
        $horario = Horario::factory()->create();

        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $this->assertSame(EstadoEvaluacionEnum::BORRADOR, $continua->estado);
        $this->assertSame(TipoEvaluacionEnum::CONTINUA, $continua->tipo);
    }

    public function test_continuas_de_la_mitad_no_incluye_las_de_otra_mitad(): void
    {
        $horario = Horario::factory()->create();
        $service = $this->service();
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $service->crearContinua($horario, MitadCicloEnum::SEGUNDA, null, '2026-09-15');

        $this->assertCount(1, $service->continuasDeLaMitad($horario, MitadCicloEnum::PRIMERA));
        $this->assertCount(1, $service->continuasDeLaMitad($horario, MitadCicloEnum::SEGUNDA));
    }

    public function test_examen_de_la_mitad_es_null_sin_sembrar(): void
    {
        $horario = Horario::factory()->create();

        $this->assertNull($this->service()->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA));
    }

    public function test_actualizar_fecha_cambia_la_fecha_de_una_evaluacion(): void
    {
        $horario = Horario::factory()->create();
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-10');

        $this->service()->actualizarFecha($continua, '2026-07-15');

        $this->assertSame('2026-07-15', $continua->fresh()->fecha->format('Y-m-d'));
    }

    public function test_actualizar_fecha_a_null_la_deja_sin_fecha(): void
    {
        $horario = Horario::factory()->create();
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $this->service()->actualizarFecha($continua, null);

        $this->assertNull($continua->fresh()->fecha);
    }

    public function test_calificar_dos_veces_al_mismo_estudiante_actualiza_en_vez_de_duplicar(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $continua = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $service->calificar($continua, $estudiante, 15.5, 'Primer intento', null);
        $service->calificar($continua, $estudiante, 18.0, 'Segundo intento', null);

        $this->assertDatabaseCount('calificaciones', 1);
        $this->assertDatabaseHas('calificaciones', ['nota_numerica' => 18.0, 'observaciones' => 'Segundo intento']);
    }

    public function test_un_estudiante_no_ve_calificaciones_de_una_mitad_sin_publicar(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 17.0, continuas: 2);

        $this->assertTrue($service->misCalificaciones($estudiante, $horario)->isEmpty());

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        // 2 continuas + 1 examen de la mitad calificada.
        $this->assertCount(3, $service->misCalificaciones($estudiante, $horario));
    }

    public function test_publicar_mitad_publica_continuas_y_examen_de_una_sola_vez(): void
    {
        $horario = Horario::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-16');
        $service->crearContinua($horario, MitadCicloEnum::SEGUNDA, null, '2026-09-15');

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        // Mitad I: 2 continuas + 1 examen, todas publicadas.
        $this->assertSame(3, Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', MitadCicloEnum::PRIMERA)
            ->where('estado', EstadoEvaluacionEnum::PUBLICADA)
            ->count());
        // Mitad II: nada publicado todavía.
        $this->assertSame(0, Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', MitadCicloEnum::SEGUNDA)
            ->where('estado', EstadoEvaluacionEnum::PUBLICADA)
            ->count());
    }

    public function test_publicar_mitad_envia_una_sola_notificacion_por_estudiante_no_una_por_columna(): void
    {
        $horario = Horario::factory()->create();
        $usuario = User::factory()->create();
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-16');
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-17');

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $this->assertSame(1, Notificacion::query()->where('user_id', $usuario->id)->count());
    }

    public function test_publicar_mitad_no_notifica_a_estudiantes_sin_usuario_vinculado(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create(['user_id' => null]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);
        $service = $this->service();
        $service->sembrarExamenes($horario);

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $this->assertSame(0, Notificacion::query()->count());
    }

    public function test_publicar_mitad_dos_veces_no_duplica_la_notificacion(): void
    {
        $horario = Horario::factory()->create();
        $usuario = User::factory()->create();
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);
        $service = $this->service();
        $service->sembrarExamenes($horario);

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $this->assertSame(1, Notificacion::query()->where('user_id', $usuario->id)->count());
    }

    public function test_promedio_mitad_pondera_60_las_continuas_y_40_el_examen(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $examen = $service->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $service->calificar($examen, $estudiante, 10.0, null, null);

        foreach (range(1, 2) as $i) {
            $continua = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
            $service->calificar($continua, $estudiante, 20.0, null, null);
        }

        // promedio(continuas)=20 * 0.6 + examen=10 * 0.4 = 16.0
        $this->assertSame(16.0, $service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA));
    }

    /**
     * Prueba explícita de que el divisor de las continuas es cuántas
     * tienen nota, no un número fijo -- antes eran siempre 4, ahora el
     * docente puede crear las que quiera.
     */
    public function test_promedio_mitad_divide_entre_la_cantidad_real_de_continuas_calificadas(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $examen = $service->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $service->calificar($examen, $estudiante, 10.0, null, null);

        foreach ([20.0, 20.0, 10.0] as $nota) {
            $continua = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
            $service->calificar($continua, $estudiante, $nota, null, null);
        }

        // promedio(continuas)=(20+20+10)/3=16.6667 * 0.6 + examen=10 * 0.4 = 14.0
        $this->assertSame(14.0, $service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA));
    }

    public function test_promedio_mitad_solo_promedia_las_continuas_que_ya_tienen_nota(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $examen = $service->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $service->calificar($examen, $estudiante, 10.0, null, null);

        $calificada1 = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $calificada2 = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-16');
        $service->calificar($calificada1, $estudiante, 20.0, null, null);
        $service->calificar($calificada2, $estudiante, 20.0, null, null);
        // Esta tercera continua existe pero todavía no tiene nota -- no debe
        // afectar el promedio ni contar como un 0.
        $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-17');

        // promedio(solo las 2 calificadas)=20 * 0.6 + examen=10 * 0.4 = 16.0
        $this->assertSame(16.0, $service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA));
    }

    public function test_promedio_mitad_es_null_si_el_examen_no_tiene_nota(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $continua = $service->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $service->calificar($continua, $estudiante, 20.0, null, null);

        $this->assertNull($service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA));
    }

    public function test_promedio_mitad_es_null_si_ninguna_continua_tiene_nota(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->sembrarExamenes($horario);
        $examen = $service->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $service->calificar($examen, $estudiante, 10.0, null, null);

        $this->assertNull($service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA));
    }

    public function test_promedio_mitad_solo_publicadas_ignora_evaluaciones_en_borrador(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 18.0, continuas: 2);

        $this->assertSame(18.0, $service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA, soloPublicadas: false));
        $this->assertNull($service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA, soloPublicadas: true));

        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $this->assertSame(18.0, $service->promedioMitad($estudiante, $horario, MitadCicloEnum::PRIMERA, soloPublicadas: true));
    }

    public function test_promedio_final_es_el_promedio_de_p1_y_p2(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 14.0, continuas: 2);
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::SEGUNDA, 18.0, continuas: 2);

        $this->assertSame(16.0, $service->promedioFinalDelEstudiante($estudiante, $horario));
    }

    public function test_promedio_final_es_null_si_falta_cualquiera_de_las_dos_mitades(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 14.0, continuas: 2);

        $this->assertNull($service->promedioFinalDelEstudiante($estudiante, $horario));
    }

    public function test_nota_letra_del_estudiante_es_c_si_el_promedio_final_desaprueba(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 10.0, continuas: 2);
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::SEGUNDA, 10.0, continuas: 2);
        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horario, MitadCicloEnum::SEGUNDA);

        $this->assertSame(NotaLetraEnum::C, $service->notaLetraDelEstudiante($estudiante, $horario));
    }

    public function test_nota_letra_del_estudiante_aprueba_con_promedio_final_de_11_a_mas(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 15.0, continuas: 2);
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::SEGUNDA, 15.0, continuas: 2);
        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horario, MitadCicloEnum::SEGUNDA);

        $this->assertSame(NotaLetraEnum::A, $service->notaLetraDelEstudiante($estudiante, $horario));
    }

    public function test_nota_letra_del_estudiante_es_null_sin_calificaciones_publicadas(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();

        $this->assertNull($this->service()->notaLetraDelEstudiante($estudiante, $horario));
    }

    public function test_resumen_mitades_del_estudiante_trae_las_continuas_y_el_promedio_de_cada_mitad(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 16.0, continuas: 2);
        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $resumen = $service->resumenMitadesDelEstudiante($estudiante, $horario);

        $this->assertCount(2, $resumen['primera']['continuas']);
        $this->assertSame('C1', $resumen['primera']['continuas'][0]['nombre']);
        $this->assertSame(16.0, $resumen['primera']['continuas'][0]['nota']);
        $this->assertSame('C2', $resumen['primera']['continuas'][1]['nombre']);
        $this->assertSame(16.0, $resumen['primera']['continuas'][1]['nota']);
        $this->assertSame(16.0, $resumen['primera']['examen']);
        $this->assertSame(16.0, $resumen['primera']['promedio']);

        $this->assertSame([], $resumen['segunda']['continuas']);
        $this->assertNull($resumen['segunda']['examen']);
        $this->assertNull($resumen['segunda']['promedio']);
    }

    public function test_registrar_comportamiento_crea_y_actualiza_en_vez_de_duplicar(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();

        $service->registrarComportamiento($horario, $estudiante, 15.0, null);
        $service->registrarComportamiento($horario, $estudiante, 18.0, null);

        $this->assertDatabaseCount('comportamientos', 1);
        $this->assertSame(18.0, (float) $service->comportamientoDelEstudiante($horario, $estudiante)->nota_numerica);
    }

    public function test_comportamiento_del_estudiante_es_null_sin_registrar(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();

        $this->assertNull($this->service()->comportamientoDelEstudiante($horario, $estudiante));
    }

    public function test_comportamientos_del_horario_indexa_por_estudiante(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $service = $this->service();
        $service->registrarComportamiento($horario, $estudiante, 17.0, null);

        $comportamientos = $service->comportamientosDelHorario($horario);

        $this->assertSame(17.0, (float) $comportamientos->get($estudiante->id)->nota_numerica);
    }

    public function test_resumen_del_estudiante_incluye_promedio_final_y_calificaciones_por_curso(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $service = $this->service();
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::PRIMERA, 17.5, continuas: 2);
        $this->calificarMitad($horario, $estudiante, MitadCicloEnum::SEGUNDA, 17.5, continuas: 2);
        $service->publicarMitad($horario, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horario, MitadCicloEnum::SEGUNDA);

        $resumen = $service->resumenDelEstudiante($estudiante);

        $this->assertCount(1, $resumen);
        $this->assertSame($horario->id, $resumen->first()['horario']->id);
        $this->assertSame(17.5, $resumen->first()['promedio']);
        // 2 continuas + 1 examen por mitad, x2 mitades.
        $this->assertCount(6, $resumen->first()['calificaciones']);
    }

    public function test_resumen_del_estudiante_no_incluye_cursos_ajenos(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        Horario::factory()->create();

        $resumen = $this->service()->resumenDelEstudiante($estudiante);

        $this->assertCount(1, $resumen);
    }

    public function test_resumen_del_estudiante_sin_notas_deja_el_promedio_nulo(): void
    {
        $horario = Horario::factory()->create();
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $resumen = $this->service()->resumenDelEstudiante($estudiante);

        $this->assertNull($resumen->first()['promedio']);
        $this->assertTrue($resumen->first()['calificaciones']->isEmpty());
    }

    public function test_resumen_por_ciclo_agrupa_los_cursos_de_cada_ciclo_por_separado(): void
    {
        $carrera = Carrera::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $cicloAnterior = Ciclo::factory()->create();
        $cicloActual = Ciclo::factory()->create();

        $horarioAnterior = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $cicloAnterior->id]);
        $horarioActual = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $cicloActual->id]);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'ciclo_id' => $cicloAnterior->id]);
        Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'ciclo_id' => $cicloActual->id]);

        $service = $this->service();
        $this->calificarMitad($horarioAnterior, $estudiante, MitadCicloEnum::PRIMERA, 12.0, continuas: 2);
        $this->calificarMitad($horarioAnterior, $estudiante, MitadCicloEnum::SEGUNDA, 12.0, continuas: 2);
        $service->publicarMitad($horarioAnterior, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horarioAnterior, MitadCicloEnum::SEGUNDA);

        $this->calificarMitad($horarioActual, $estudiante, MitadCicloEnum::PRIMERA, 18.0, continuas: 2);
        $this->calificarMitad($horarioActual, $estudiante, MitadCicloEnum::SEGUNDA, 18.0, continuas: 2);
        $service->publicarMitad($horarioActual, MitadCicloEnum::PRIMERA);
        $service->publicarMitad($horarioActual, MitadCicloEnum::SEGUNDA);

        $porCiclo = $service->resumenDelEstudiantePorCiclo($estudiante);

        $this->assertCount(2, $porCiclo);
        $this->assertSame($cicloActual->id, $porCiclo->first()['ciclo']->id);
        $this->assertSame(18.0, $porCiclo->first()['promedioGeneral']);
        $this->assertSame($cicloAnterior->id, $porCiclo->last()['ciclo']->id);
        $this->assertSame(12.0, $porCiclo->last()['promedioGeneral']);
    }
}
