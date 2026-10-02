<?php

namespace Tests\Feature\Matricula;

use App\Modules\Academico\Models\Horario;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatriculaTodosLosHorariosTest extends TestCase
{
    use RefreshDatabase;

    public function test_sin_refuerzos_devuelve_los_mismos_horarios_que_scope_de_la_matricula(): void
    {
        $horario = Horario::factory()->create();
        $matricula = Matricula::factory()->create([
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $resultado = $matricula->todosLosHorarios();

        $this->assertCount(1, $resultado);
        $this->assertTrue($resultado->contains('id', $horario->id));
    }

    public function test_incluye_el_horario_de_un_refuerzo_con_seccion_asignada(): void
    {
        $horarioDelCiclo = Horario::factory()->create();
        $matricula = Matricula::factory()->create([
            'carrera_id' => $horarioDelCiclo->carrera_id,
            'ciclo_curricular' => $horarioDelCiclo->ciclo_curricular,
            'ciclo_id' => $horarioDelCiclo->ciclo_id,
        ]);

        // El horario del curso en recuperación es de otro ciclo_curricular
        // -- no calzaría nunca con scopeDeLaMatricula() de esta matrícula.
        $horarioDeRefuerzo = Horario::factory()->create([
            'carrera_id' => $horarioDelCiclo->carrera_id,
        ]);
        MatriculaRefuerzo::factory()->create([
            'matricula_id' => $matricula->id,
            'curso_id' => $horarioDeRefuerzo->curso_id,
            'horario_id' => $horarioDeRefuerzo->id,
            'estado' => EstadoRefuerzoEnum::CURSANDO,
        ]);

        $resultado = $matricula->todosLosHorarios();

        $this->assertCount(2, $resultado);
        $this->assertTrue($resultado->contains('id', $horarioDelCiclo->id));
        $this->assertTrue($resultado->contains('id', $horarioDeRefuerzo->id));
    }

    public function test_no_incluye_un_refuerzo_pendiente_sin_horario_asignado(): void
    {
        $horarioDelCiclo = Horario::factory()->create();
        $matricula = Matricula::factory()->create([
            'carrera_id' => $horarioDelCiclo->carrera_id,
            'ciclo_curricular' => $horarioDelCiclo->ciclo_curricular,
            'ciclo_id' => $horarioDelCiclo->ciclo_id,
        ]);

        MatriculaRefuerzo::factory()->create([
            'matricula_id' => $matricula->id,
            'horario_id' => null,
            'estado' => EstadoRefuerzoEnum::PENDIENTE,
        ]);

        $resultado = $matricula->todosLosHorarios();

        $this->assertCount(1, $resultado);
    }
}
