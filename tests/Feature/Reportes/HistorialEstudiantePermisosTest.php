<?php

namespace Tests\Feature\Reportes;

use App\Models\User;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Models\Calificacion;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Enums\ModalidadEstudioEnum;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Pagos\Models\Pago;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

class HistorialEstudiantePermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Completa y publica ambas mitades con la misma nota -- el Promedio
     * Final que muestra la libreta exige las dos (ver
     * EvaluacionService::promedioFinalDelEstudiante()), así que con una
     * sola mitad calificada el promedio quedaría nulo y no se vería nada.
     */
    private function calificarYPublicarMitad(Horario $horario, Estudiante $estudiante, float $nota): void
    {
        $service = $this->app->make(EvaluacionService::class);
        $service->sembrarExamenes($horario);

        foreach (MitadCicloEnum::cases() as $mitad) {
            $examen = $service->examenDeLaMitad($horario, $mitad);
            $service->calificar($examen, $estudiante, $nota, null, null);
            $continua = $service->crearContinua($horario, $mitad, null, '2026-07-15');
            $service->calificar($continua, $estudiante, $nota, null, null);
            $service->publicarMitad($horario, $mitad);
        }
    }

    public function test_coordinador_puede_ver_el_historial_de_estudiante(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador)
            ->get(route('historial-estudiante.index'))
            ->assertOk();
    }

    public function test_gerencia_puede_ver_el_historial_de_estudiante(): void
    {
        $gerencia = User::factory()->create();
        $gerencia->assignRole(RolEnum::GERENCIA->value);

        $this->actingAs($gerencia)
            ->get(route('historial-estudiante.index'))
            ->assertOk();
    }

    public function test_docente_no_puede_ver_el_historial_de_estudiante(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get(route('historial-estudiante.index'))
            ->assertForbidden();
    }

    public function test_administrativo_no_puede_ver_el_historial_de_estudiante(): void
    {
        $administrativo = User::factory()->create();
        $administrativo->assignRole(RolEnum::ADMINISTRATIVO->value);

        $this->actingAs($administrativo)
            ->get(route('historial-estudiante.index'))
            ->assertForbidden();
    }

    public function test_estudiante_no_puede_ver_el_historial_de_estudiante(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);

        $this->actingAs($usuario)
            ->get(route('historial-estudiante.index'))
            ->assertForbidden();
    }

    public function test_buscar_por_dni_muestra_al_estudiante_en_la_lista_de_resultados(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        Estudiante::factory()->create(['dni' => '55667788', 'nombres' => 'Carla', 'apellidos' => 'Robles Díaz']);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', '55667788')
            ->assertSee('Carla Robles Díaz');
    }

    public function test_buscar_por_nombre_muestra_al_estudiante_en_la_lista_de_resultados(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        Estudiante::factory()->create(['dni' => '55667788', 'nombres' => 'Carla', 'apellidos' => 'Robles Díaz']);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Robles')
            ->assertSee('Carla Robles Díaz')
            ->assertSee('55667788');
    }

    public function test_buscar_un_termino_sin_coincidencias_muestra_un_mensaje_claro(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Nadie Existe')
            ->assertSee('No se encontraron estudiantes');
    }

    public function test_elegir_un_resultado_muestra_el_historial_del_estudiante(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667788', 'nombres' => 'Carla', 'apellidos' => 'Robles Díaz']);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Robles')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertHasNoErrors()
            ->assertSee('DNI 55667788');
    }

    public function test_el_historial_muestra_la_modalidad_de_estudio_de_cada_matricula(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667799', 'nombres' => 'Marco', 'apellidos' => 'Villar Soto']);
        $ciclo = Ciclo::factory()->create();
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'modalidad_estudio' => ModalidadEstudioEnum::VIRTUAL,
        ]);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Villar Soto')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertHasNoErrors()
            ->assertSee('Virtual');
    }

    public function test_el_historial_muestra_el_periodo_de_la_matricula(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667766', 'nombres' => 'Lucia', 'apellidos' => 'Ramos Chumbe']);
        $ciclo = Ciclo::factory()->create(['anio' => 2026]);
        $periodo = Periodo::factory()->create(['tipo' => TipoPeriodoEnum::PRIMERO, 'anio' => 2026]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'siagie_id' => $periodo->id,
        ]);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Ramos Chumbe')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertHasNoErrors()
            ->assertSee('Periodo 2026-1');
    }

    public function test_el_historial_muestra_el_detalle_de_pagos_ya_cobrados(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667700', 'nombres' => 'Elmer', 'apellidos' => 'Palomino Ochoa']);
        Pago::factory()->aprobado()->create(['estudiante_id' => $estudiante->id, 'monto' => 120]);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Palomino Ochoa')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertHasNoErrors()
            ->assertSee('Detalle de pagos')
            ->assertSee('S/ 120.00');
    }

    public function test_seleccionar_estudiante_preselecciona_la_libreta_del_ciclo_mas_reciente(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667711', 'nombres' => 'Hernán', 'apellidos' => 'Ochoa Rojas']);

        $matriculaVieja = Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'estado' => 'aprobada', 'fecha_matricula' => now()->subYear()]);
        $matriculaReciente = Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'estado' => 'aprobada', 'fecha_matricula' => now()]);

        foreach ([$matriculaVieja, $matriculaReciente] as $matricula) {
            $curso = Curso::factory()->create(['carrera_id' => $matricula->carrera_id, 'ciclo_curricular' => $matricula->ciclo_curricular]);
            $horario = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $matricula->ciclo_id]);
            $evaluacion = Evaluacion::factory()->create(['horario_id' => $horario->id, 'estado' => 'publicada']);
            Calificacion::factory()->create(['evaluacion_id' => $evaluacion->id, 'estudiante_id' => $estudiante->id, 'nota_numerica' => 15]);
        }

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->set('terminoBusqueda', 'Ochoa Rojas')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertSet('cicloLibretaId', $matriculaReciente->ciclo_id)
            ->assertSee('Libreta de notas')
            ->assertSee('Exportar libreta (PDF)');
    }

    public function test_cambiar_el_ciclo_de_la_libreta_filtra_las_notas_mostradas(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667712', 'nombres' => 'Carmen', 'apellidos' => 'Torres Rojas']);

        $matriculaUno = Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'estado' => 'aprobada', 'fecha_matricula' => now()->subYear()]);
        $matriculaDos = Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'estado' => 'aprobada', 'fecha_matricula' => now()]);

        $cursoUno = Curso::factory()->create(['carrera_id' => $matriculaUno->carrera_id, 'ciclo_curricular' => $matriculaUno->ciclo_curricular]);
        $horarioUno = Horario::factory()->create(['curso_id' => $cursoUno->id, 'ciclo_id' => $matriculaUno->ciclo_id]);
        $this->calificarYPublicarMitad($horarioUno, $estudiante, 12.0);

        $cursoDos = Curso::factory()->create(['carrera_id' => $matriculaDos->carrera_id, 'ciclo_curricular' => $matriculaDos->ciclo_curricular]);
        $horarioDos = Horario::factory()->create(['curso_id' => $cursoDos->id, 'ciclo_id' => $matriculaDos->ciclo_id]);
        $this->calificarYPublicarMitad($horarioDos, $estudiante, 18.0);

        $this->actingAs($coordinador);

        Volt::test('historial-estudiante.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->assertSet('cicloLibretaId', $matriculaDos->ciclo_id)
            ->assertSee('18.00')
            ->set('cicloLibretaId', $matriculaUno->ciclo_id)
            ->assertSee('12.00');
    }

    public function test_exportar_libreta_pdf_descarga_el_pdf_del_ciclo_elegido(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667713', 'nombres' => 'Julio', 'apellidos' => 'Rojas Medina']);
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id, 'estado' => 'aprobada']);

        $this->actingAs($coordinador);

        $testable = Volt::test('historial-estudiante.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('cicloLibretaId', $matricula->ciclo_id)
            ->call('exportarLibretaPdf');

        $this->assertArrayHasKey('download', $testable->effects);
        $this->assertSame('application/pdf', $testable->effects['download']['contentType']);
    }

    public function test_el_enlace_de_historial_aparece_en_el_menu_para_coordinador(): void
    {
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($coordinador)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertSee('Historial de estudiante');
    }

    public function test_el_enlace_de_historial_no_aparece_en_el_menu_para_docente(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertDontSee('Historial de estudiante');
    }
}
