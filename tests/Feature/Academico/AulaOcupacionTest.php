<?php

namespace Tests\Feature\Academico;

use App\Models\Carrera;
use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Aula;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Services\AulaService;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AulaOcupacionTest extends TestCase
{
    use RefreshDatabase;

    private function service(): AulaService
    {
        return $this->app->make(AulaService::class);
    }

    private function matricular(Horario $horario): Estudiante
    {
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        return $estudiante;
    }

    public function test_cuenta_los_estudiantes_matriculados_por_aula_y_dia(): void
    {
        $ciclo = Ciclo::factory()->create();
        $aula = Aula::factory()->create(['nombre' => 'Aula 1', 'capacidad' => 30]);
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id, 'aula_id' => $aula->id]);
        $horario->dias()->delete();
        $horario->dias()->create(['dia_semana' => DiaSemanaEnum::LUNES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);
        $horario->dias()->create(['dia_semana' => DiaSemanaEnum::MIERCOLES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);

        $this->matricular($horario);
        $this->matricular($horario);

        $ocupacion = $this->service()->ocupacion($ciclo->id);
        $filaAula1 = $ocupacion->firstWhere(fn (array $fila) => $fila['aula']->id === $aula->id);

        $this->assertSame(2, $filaAula1['porDia']['lunes']['totalEstudiantes']);
        $this->assertSame(2, $filaAula1['porDia']['miercoles']['totalEstudiantes']);
    }

    public function test_un_aula_sin_horarios_en_el_ciclo_aparece_con_ocupacion_vacia(): void
    {
        $ciclo = Ciclo::factory()->create();
        Aula::factory()->create(['nombre' => 'Aula libre']);

        $ocupacion = $this->service()->ocupacion($ciclo->id);
        $fila = $ocupacion->firstWhere(fn (array $fila) => $fila['aula']->nombre === 'Aula libre');

        $this->assertTrue($fila['porDia']->isEmpty());
    }

    public function test_no_incluye_aulas_inactivas(): void
    {
        $ciclo = Ciclo::factory()->create();
        Aula::factory()->create(['nombre' => 'Aula inactiva', 'activa' => false]);

        $ocupacion = $this->service()->ocupacion($ciclo->id);

        $this->assertNull($ocupacion->firstWhere(fn (array $fila) => $fila['aula']->nombre === 'Aula inactiva'));
    }

    /**
     * La misma carrera+ciclo curricular (cohorte) puede tener varios cursos
     * en la misma aula en días distintos (ej. Comunicación lunes/miércoles,
     * Matemática martes/jueves): al ser el mismo grupo de estudiantes,
     * cuentan en el total de TODOS esos días -- no es que "se dividan"
     * entre ellos.
     */
    public function test_la_misma_carrera_y_ciclo_cuenta_en_cada_dia_donde_tiene_un_curso(): void
    {
        $ciclo = Ciclo::factory()->create();
        $aula = Aula::factory()->create(['capacidad' => 30]);
        $carrera = Carrera::factory()->create();

        $cursoA = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioA = Horario::factory()->create(['ciclo_id' => $ciclo->id, 'aula_id' => $aula->id, 'curso_id' => $cursoA->id]);
        $horarioA->dias()->delete();
        $horarioA->dias()->create(['dia_semana' => DiaSemanaEnum::LUNES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);
        $horarioA->dias()->create(['dia_semana' => DiaSemanaEnum::MIERCOLES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
            'ciclo_id' => $ciclo->id,
        ]);

        $cursoB = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $horarioB = Horario::factory()->create(['ciclo_id' => $ciclo->id, 'aula_id' => $aula->id, 'curso_id' => $cursoB->id]);
        $horarioB->dias()->delete();
        $horarioB->dias()->create(['dia_semana' => DiaSemanaEnum::MARTES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);
        $horarioB->dias()->create(['dia_semana' => DiaSemanaEnum::JUEVES, 'hora_inicio' => '18:00:00', 'hora_fin' => '20:00:00']);

        $ocupacion = $this->service()->ocupacion($ciclo->id);
        $fila = $ocupacion->firstWhere(fn (array $fila) => $fila['aula']->id === $aula->id);

        $this->assertSame(1, $fila['porDia']['lunes']['totalEstudiantes']);
        $this->assertSame(1, $fila['porDia']['miercoles']['totalEstudiantes']);
        $this->assertSame(1, $fila['porDia']['martes']['totalEstudiantes']);
        $this->assertSame(1, $fila['porDia']['jueves']['totalEstudiantes']);
    }
}
