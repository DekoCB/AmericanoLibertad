<?php

namespace Tests\Feature\Asistencia;

use App\Models\User;
use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Horario;
use App\Modules\Asistencia\Enums\EstadoAsistenciaEnum;
use App\Modules\Asistencia\Services\AsistenciaInstitutoService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Volt\Volt;
use Tests\TestCase;

class ConfirmarPorQrTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * @return array{0: Horario, 1: User, 2: Estudiante, 3: Carbon}
     */
    private function estudianteConClaseUnDomingo(): array
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
            'hora_inicio' => '18:00:00',
            'hora_fin' => '20:00:00',
        ]);

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id, 'dni' => '87654321']);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
            'estado' => 'aprobada',
        ]);

        return [$horario, $usuario, $estudiante, $domingo];
    }

    public function test_el_estudiante_marca_su_asistencia_escaneando_el_codigo_de_su_aula(): void
    {
        [$horario, $usuario, $estudiante, $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', "AULA:{$horario->id}")
            ->assertHasNoErrors();

        $this->assertDatabaseHas('asistencias', [
            'horario_id' => $horario->id,
            'estudiante_id' => $estudiante->id,
            'fecha' => $domingo->format('Y-m-d'),
            'estado' => EstadoAsistenciaEnum::PRESENTE->value,
        ]);
    }

    public function test_rechaza_un_codigo_de_aula_que_no_pertenece_a_un_curso_del_estudiante(): void
    {
        [, $usuario, , $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', 'AULA:999999')
            ->assertHasErrors('qr');

        $this->assertDatabaseCount('asistencias', 0);
    }

    public function test_rechaza_un_codigo_de_aula_de_un_curso_suyo_que_no_esta_en_curso_ahora(): void
    {
        [$horario, $usuario, , $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(10, 0));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', "AULA:{$horario->id}")
            ->assertHasErrors('qr');

        $this->assertDatabaseCount('asistencias', 0);
    }

    public function test_rechaza_un_codigo_de_aula_de_otro_curso_mientras_tiene_una_clase_distinta_en_curso(): void
    {
        [$horario, $usuario, $estudiante, $domingo] = $this->estudianteConClaseUnDomingo();

        $otroHorario = Horario::factory()->create([
            'ciclo_id' => $horario->ciclo_id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
        ]);
        $otroHorario->dias()->delete();
        $otroHorario->dias()->create([
            'dia_semana' => DiaSemanaEnum::DOMINGO,
            'hora_inicio' => '18:00:00',
            'hora_fin' => '20:00:00',
        ]);

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', "AULA:{$otroHorario->id}")
            ->assertHasErrors('qr');

        $this->assertDatabaseCount('asistencias', 0);
    }

    public function test_rechaza_un_codigo_no_reconocido(): void
    {
        [, $usuario, , $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', 'basura')
            ->assertHasErrors('qr');

        $this->assertDatabaseCount('asistencias', 0);
    }

    public function test_escanear_el_mismo_codigo_de_aula_dos_veces_no_sobreescribe_el_registro_existente(): void
    {
        [$horario, $usuario, $estudiante, $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')->call('confirmarPorQr', "AULA:{$horario->id}")->assertHasNoErrors();
        Volt::test('asistencia.marcar')->call('confirmarPorQr', "AULA:{$horario->id}")->assertHasNoErrors();

        $this->assertDatabaseCount('asistencias', 1);
        $this->assertDatabaseHas('asistencias', [
            'horario_id' => $horario->id,
            'estudiante_id' => $estudiante->id,
            'estado' => EstadoAsistenciaEnum::PRESENTE->value,
        ]);
    }

    public function test_escanear_el_codigo_del_instituto_registra_el_ingreso_sin_afectar_el_resultado_de_clase(): void
    {
        [, $usuario, $estudiante, $domingo] = $this->estudianteConClaseUnDomingo();

        $this->travelTo($domingo->copy()->setTime(18, 5));
        $this->actingAs($usuario);

        Volt::test('asistencia.marcar')
            ->call('confirmarPorQr', AsistenciaInstitutoService::CODIGO_QR)
            ->assertHasNoErrors()
            ->assertSet('resultado', null);

        $this->assertDatabaseHas('ingresos_instituto', [
            'estudiante_id' => $estudiante->id,
            'fecha' => $domingo->format('Y-m-d'),
        ]);
        $this->assertDatabaseCount('asistencias', 0);
    }

    public function test_un_docente_no_puede_acceder_a_la_pagina_de_autorregistro(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get(route('asistencia.marcar'))
            ->assertForbidden();
    }
}
