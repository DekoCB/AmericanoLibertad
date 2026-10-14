<?php

namespace Tests\Feature\Asistencia;

use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Horario;
use App\Modules\Asistencia\Services\AsistenciaInstitutoService;
use App\Modules\Matricula\Enums\EstadoEstudianteEnum;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AsistenciaInstitutoServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Estudiante, 1: Carbon}
     */
    private function estudianteConClaseUnDomingoA(string $horaInicio): array
    {
        $domingo = Carbon::now()->next(Carbon::SUNDAY);

        $ciclo = Ciclo::factory()->create([
            'fecha_inicio' => $domingo->copy()->subMonth()->format('Y-m-d'),
            'fecha_fin' => $domingo->copy()->addMonth()->format('Y-m-d'),
        ]);
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id]);
        $horario->dias()->delete();
        $horario->dias()->create([
            'dia_semana' => DiaSemanaEnum::DOMINGO,
            'hora_inicio' => $horaInicio,
            'hora_fin' => '20:00:00',
        ]);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
            'estado' => 'aprobada',
        ]);

        return [$estudiante, $domingo];
    }

    public function test_registrar_ingreso_crea_un_registro_presente_dentro_del_margen_de_tolerancia(): void
    {
        [$estudiante, $domingo] = $this->estudianteConClaseUnDomingoA('08:00:00');

        $this->travelTo($domingo->copy()->setTime(8, 10));

        $ingreso = app(AsistenciaInstitutoService::class)->registrarIngreso($estudiante);

        $this->assertFalse($ingreso->llego_tarde);
        $this->assertSame($domingo->format('Y-m-d'), $ingreso->fecha);
    }

    public function test_registrar_ingreso_marca_tardanza_pasado_el_margen_de_tolerancia(): void
    {
        [$estudiante, $domingo] = $this->estudianteConClaseUnDomingoA('08:00:00');

        $this->travelTo($domingo->copy()->setTime(8, 20));

        $ingreso = app(AsistenciaInstitutoService::class)->registrarIngreso($estudiante);

        $this->assertTrue($ingreso->llego_tarde);
    }

    public function test_registrar_ingreso_es_idempotente_y_no_sobreescribe_el_registro_del_dia(): void
    {
        [$estudiante, $domingo] = $this->estudianteConClaseUnDomingoA('08:00:00');
        $service = app(AsistenciaInstitutoService::class);

        $this->travelTo($domingo->copy()->setTime(8, 10));
        $primero = $service->registrarIngreso($estudiante);
        $this->assertFalse($primero->llego_tarde);

        $this->travelTo($domingo->copy()->setTime(9, 0));
        $segundo = $service->registrarIngreso($estudiante);

        $this->assertSame($primero->id, $segundo->id);
        $this->assertFalse($segundo->fresh()->llego_tarde);
        $this->assertDatabaseCount('ingresos_instituto', 1);
    }

    public function test_registrar_ingreso_sin_clases_programadas_hoy_se_registra_como_a_tiempo(): void
    {
        $sabado = Carbon::now()->next(Carbon::SATURDAY);

        $ciclo = Ciclo::factory()->create([
            'fecha_inicio' => $sabado->copy()->subMonth()->format('Y-m-d'),
            'fecha_fin' => $sabado->copy()->addMonth()->format('Y-m-d'),
        ]);
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id]);
        $horario->dias()->delete();
        $horario->dias()->create([
            'dia_semana' => DiaSemanaEnum::DOMINGO,
            'hora_inicio' => '08:00:00',
            'hora_fin' => '10:00:00',
        ]);

        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
            'estado' => 'aprobada',
        ]);

        $this->travelTo($sabado->copy()->setTime(15, 0));

        $ingreso = app(AsistenciaInstitutoService::class)->registrarIngreso($estudiante);

        $this->assertFalse($ingreso->llego_tarde);
    }

    public function test_reporte_incluye_a_todos_los_estudiantes_activos_incluso_sin_registro(): void
    {
        [$estudianteConRegistro, $domingo] = $this->estudianteConClaseUnDomingoA('08:00:00');
        $this->travelTo($domingo->copy()->setTime(8, 10));

        $service = app(AsistenciaInstitutoService::class);
        $service->registrarIngreso($estudianteConRegistro);

        $estudianteSinRegistro = Estudiante::factory()->create(['estado' => EstadoEstudianteEnum::ACTIVO]);
        $estudianteRetirado = Estudiante::factory()->create(['estado' => EstadoEstudianteEnum::RETIRADO]);

        $reporte = collect($service->reporte($domingo->format('Y-m-d')));

        $this->assertSame(2, $reporte->count());

        $filaConRegistro = $reporte->firstWhere('estudiante.id', $estudianteConRegistro->id);
        $this->assertNotNull($filaConRegistro['ingreso']);

        $filaSinRegistro = $reporte->firstWhere('estudiante.id', $estudianteSinRegistro->id);
        $this->assertNull($filaSinRegistro['ingreso']);

        $this->assertNull($reporte->firstWhere('estudiante.id', $estudianteRetirado->id));
    }
}
