<?php

namespace Tests\Feature\Matricula;

use App\Models\Carrera;
use App\Models\User;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\Periodo;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Enums\EstadoCivilEnum;
use App\Modules\Matricula\Enums\TipoDocumentoEnum;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Matricula\Services\DocumentoEstudianteService;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use App\Modules\Migraciones\Models\MatriculaRefuerzo;
use App\Modules\Pagos\Models\PlanPago;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Features\SupportTesting\Testable;
use Livewire\Volt\Volt;
use Tests\TestCase;

class MatriculaPermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_rol_coordinador_puede_ver_el_listado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario)
            ->get('/matricula')
            ->assertOk();
    }

    public function test_un_docente_no_puede_ver_matricula(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($docente)
            ->get('/matricula')
            ->assertForbidden();
    }

    /**
     * Un Periodo con su Ciclo espejo (ver PeriodoService) y ese Ciclo con su
     * propio periodo de matrícula ya abierto -- la única forma de que el
     * wizard acepte matricular en él (ver with()/confirmar() del wizard).
     */
    private function periodoConMatriculaAbierta(): Periodo
    {
        $periodo = Periodo::factory()->create();
        $ciclo = Ciclo::factory()->conPeriodo()->activo()->create([
            'anio' => $periodo->anio,
            'siagie_id' => $periodo->id,
        ]);
        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(10),
        ]);

        return $periodo;
    }

    public function test_completar_el_wizard_registra_estudiante_y_matricula(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $ciclo = $periodo->ciclo;
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Luis')
            ->set('apellidos', 'Fernández Ruiz')
            ->set('dni', '55667788')
            ->set('fechaNacimiento', now()->subYears(28)->format('Y-m-d'))
            ->set('observacionesEstudiante', 'Pendiente entregar certificado de estudios del colegio anterior.')
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $this->assertDatabaseHas('estudiantes', ['dni' => '55667788']);
        $estudiante = Estudiante::query()->where('dni', '55667788')->firstOrFail();
        $this->assertDatabaseHas('matriculas', ['estudiante_id' => $estudiante->id, 'ciclo_id' => $ciclo->id]);
        $this->assertSame('Pendiente entregar certificado de estudios del colegio anterior.', $estudiante->observaciones);
    }

    public function test_subir_cara_y_reverso_del_dni_guarda_ambas_colecciones_de_media(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Marisol')
            ->set('apellidos', 'Chuquimango Vera')
            ->set('dni', '55667799')
            ->set('fechaNacimiento', now()->subYears(25)->format('Y-m-d'))
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->image('dni-cara.jpg'))
            ->set('dniEstudianteReversoArchivo', UploadedFile::fake()->image('dni-reverso.jpg'))
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667799')->firstOrFail();
        $documento = $estudiante->documentos()->where('tipo', 'dni_estudiante')->firstOrFail();

        $this->assertNotNull($documento->getFirstMedia('archivo'));
        $this->assertNotNull($documento->getFirstMedia('reverso'));
    }

    public function test_elegir_una_fecha_de_matricula_pasada_se_respeta_en_vez_de_usar_hoy(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();
        $fechaElegida = now()->subDays(5)->format('Y-m-d');

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Oscar')
            ->set('apellidos', 'Beltran Soto')
            ->set('dni', '55667733')
            ->set('fechaNacimiento', now()->subYears(27)->format('Y-m-d'))
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->set('fechaMatricula', $fechaElegida)
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667733')->firstOrFail();
        $matricula = Matricula::query()->where('estudiante_id', $estudiante->id)->firstOrFail();

        $this->assertSame($fechaElegida, $matricula->fecha_matricula->format('Y-m-d'));
    }

    public function test_guardar_celulares_adicionales_para_un_estudiante_mayor_de_edad(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Patricia')
            ->set('apellidos', 'Salcedo Nina')
            ->set('dni', '55667722')
            ->set('fechaNacimiento', now()->subYears(30)->format('Y-m-d'))
            ->set('celular', '987654321')
            ->call('agregarCelular')
            ->set('celularesAdicionales.0', '912345678')
            ->call('agregarCelular')
            ->set('celularesAdicionales.1', '923456789')
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667722')->firstOrFail();

        $this->assertSame(2, $estudiante->telefonos()->count());
        $this->assertDatabaseHas('estudiante_telefonos', ['estudiante_id' => $estudiante->id, 'numero' => '912345678']);
        $this->assertDatabaseHas('estudiante_telefonos', ['estudiante_id' => $estudiante->id, 'numero' => '923456789']);
    }

    public function test_quitar_celular_adicional_lo_remueve_de_la_lista(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->call('agregarCelular')
            ->set('celularesAdicionales.0', '912345678')
            ->call('agregarCelular')
            ->set('celularesAdicionales.1', '923456789')
            ->call('quitarCelular', 0)
            ->assertSet('celularesAdicionales', ['923456789']);
    }

    public function test_descargar_pdf_del_dni_solo_esta_disponible_con_ambas_caras(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create();

        $documentoService = $this->app->make(DocumentoEstudianteService::class);
        $documento = $documentoService->subir(
            $estudiante,
            TipoDocumentoEnum::DNI_ESTUDIANTE,
            UploadedFile::fake()->image('cara.jpg'),
            $usuario->id,
            UploadedFile::fake()->image('reverso.jpg'),
        );

        $this->actingAs($usuario);

        $testable = Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('descargarDniPdf', $documento->id);

        $this->assertArrayHasKey('download', $testable->effects);
        $this->assertSame('application/pdf', $testable->effects['download']['contentType']);
    }

    public function test_registrar_matricula_desde_el_wizard_guarda_el_periodo_elegido(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Rosa')
            ->set('apellidos', 'Delgado Vera')
            ->set('dni', '55667711')
            ->set('fechaNacimiento', now()->subYears(30)->format('Y-m-d'))
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667711')->firstOrFail();
        $this->assertDatabaseHas('matriculas', ['estudiante_id' => $estudiante->id, 'siagie_id' => $periodo->id]);
    }

    public function test_elegir_un_periodo_en_el_wizard_matricula_en_su_ciclo_espejo_con_la_modalidad_elegida(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = Periodo::factory()->create(['anio' => 2026]);
        $ciclo = Ciclo::factory()->conPeriodo()->create(['anio' => 2026, 'siagie_id' => $periodo->id]);
        $ciclo->periodosMatricula()->create(['fecha_inicio' => now()->subDays(10), 'fecha_fin' => now()->addDays(10)]);
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Marisol')
            ->set('apellidos', 'Peña Ríos')
            ->set('dni', '55667950')
            ->set('fechaNacimiento', now()->subYears(28)->format('Y-m-d'))
            ->call('avanzar')
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('modalidadEstudio', 'virtual')
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667950')->firstOrFail();
        $this->assertDatabaseHas('matriculas', [
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'modalidad_estudio' => 'virtual',
        ]);
    }

    public function test_el_wizard_detecta_un_dni_existente_y_permite_rematricular_sin_repetir_los_datos(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $ciclo = $periodo->ciclo;
        $carrera = Carrera::factory()->create();

        $estudiante = Estudiante::factory()->create(['dni' => '55667890']);

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('dni', '55667890')
            ->assertSet('estudianteEncontradoId', $estudiante->id)
            ->call('continuarComoRematricula')
            ->assertSet('esRematricula', true)
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        // No se crea una ficha nueva: sigue siendo el mismo estudiante, solo se le agrega la matrícula.
        $this->assertDatabaseCount('estudiantes', 1);
        $this->assertDatabaseHas('matriculas', [
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
        ]);
    }

    public function test_el_wizard_sigue_bloqueando_avanzar_con_un_dni_ya_registrado_si_no_se_elige_rematricular(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        Estudiante::factory()->create(['dni' => '55667891']);

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Otro')
            ->set('apellidos', 'Nombre')
            ->set('dni', '55667891')
            ->set('fechaNacimiento', now()->subYears(25)->format('Y-m-d'))
            ->call('avanzar')
            ->assertSet('paso', 1)
            ->assertHasErrors('dni');

        $this->assertDatabaseCount('estudiantes', 1);
    }

    public function test_el_wizard_configura_un_cronograma_de_pagos_personalizado_al_matricular(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        $fechaCuotaAjustada = now()->addDays(5)->format('Y-m-d');

        Volt::test('matricula.wizard')
            ->set('nombres', 'Marisol')
            ->set('apellidos', 'Peña Ríos')
            ->set('dni', '55667799')
            ->set('fechaNacimiento', now()->subYears(30)->format('Y-m-d'))
            ->call('avanzar')
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('avanzar')
            ->assertHasNoErrors()
            ->assertSet('paso', 6)
            ->set('configurarCronograma', true)
            ->set('numeroCuotasCronograma', '6')
            ->set('montoTotalCronograma', '600')
            ->call('generarCronogramaAutomatico')
            ->assertHasNoErrors()
            ->assertSet('cuotaMontos.1', '100.00')
            // Ajusta la primera cuota a mano: distinta del reparto parejo automático.
            ->set('cuotaMontos.1', '150')
            ->set('cuotaFechas.1', $fechaCuotaAjustada)
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667799')->firstOrFail();
        $matricula = $estudiante->matriculas()->firstOrFail();
        $plan = PlanPago::query()->where('matricula_id', $matricula->id)->with('cuotas')->firstOrFail();

        $this->assertCount(6, $plan->cuotas);
        $primeraCuota = $plan->cuotas->firstWhere('numero', 1);
        $this->assertSame('150.00', $primeraCuota->monto);
        $this->assertSame($fechaCuotaAjustada, $primeraCuota->fecha_vencimiento->format('Y-m-d'));
        // El total del plan refleja la suma real de las cuotas (con el ajuste), no el monto tipeado originalmente.
        $this->assertSame('650.00', $plan->monto_total);
    }

    public function test_el_wizard_no_crea_plan_de_pago_si_no_se_configura_cronograma(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = $this->periodoConMatriculaAbierta();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->set('nombres', 'Renzo')
            ->set('apellidos', 'Villar Soto')
            ->set('dni', '55667700')
            ->set('fechaNacimiento', now()->subYears(30)->format('Y-m-d'))
            ->call('avanzar')
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5)
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('avanzar')
            ->assertSet('paso', 6)
            ->call('confirmar')
            ->assertHasNoErrors()
            ->assertDispatched('matricula-registrada');

        $estudiante = Estudiante::query()->where('dni', '55667700')->firstOrFail();
        $matricula = $estudiante->matriculas()->firstOrFail();

        $this->assertDatabaseMissing('planes_pago', ['matricula_id' => $matricula->id]);
    }

    /**
     * Avanza el wizard hasta el paso 5 (Matrícula) para un estudiante mayor
     * de edad recién creado, listo para setear cicloId/carreraId/cicloCurricular.
     */
    private function wizardEnPasoDeMatricula(string $dni): Testable
    {
        return Volt::test('matricula.wizard')
            ->set('nombres', 'Luis')
            ->set('apellidos', 'Fernández Ruiz')
            ->set('dni', $dni)
            ->set('fechaNacimiento', now()->subYears(28)->format('Y-m-d'))
            ->call('avanzar')
            ->assertSet('paso', 3)
            ->set('dniEstudianteCaraArchivo', UploadedFile::fake()->create('dni.pdf', 100, 'application/pdf'))
            ->call('avanzar')
            ->assertSet('paso', 4)
            ->call('avanzar')
            ->assertSet('paso', 5);
    }

    public function test_matricular_sin_ninguna_ventana_de_matricula_abierta_no_bloquea_el_wizard(): void
    {
        // A pedido del cliente: la ventana de matrícula (periodos_matricula)
        // ya no bloquea matricular -- queda solo como registro informativo.
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodo = Periodo::factory()->create();
        $ciclo = Ciclo::factory()->conPeriodo()->activo()->create([
            'anio' => $periodo->anio,
            'siagie_id' => $periodo->id,
        ]);
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        $this->wizardEnPasoDeMatricula('55667802')
            ->set('periodoId', (string) $periodo->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasNoErrors();

        $this->assertDatabaseCount('estudiantes', 1);
        $estudiante = Estudiante::query()->where('dni', '55667802')->firstOrFail();
        $this->assertDatabaseHas('matriculas', ['estudiante_id' => $estudiante->id, 'ciclo_id' => $ciclo->id]);
    }

    public function test_un_periodo_sin_ciclo_espejo_no_aparece_como_opcion_en_el_wizard(): void
    {
        // Regresión real de producción: al quitar la exigencia de ventana de
        // matrícula abierta, el selector de periodos dejó de garantizar
        // implícitamente que el periodo elegido tuviera un Ciclo espejo --
        // un Periodo huérfano (sin Ciclo) quedó seleccionable y confirmar()
        // reventaba con un error fatal (null->id) en vez de un error de
        // validación. PeriodoService::crear() siempre crea ambos juntos, así
        // que esto no debería pasar en uso normal, pero el selector igual
        // debe protegerse de un registro inconsistente.
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodoHuerfano = Periodo::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->assertDontSee($periodoHuerfano->nombreCompleto());
    }

    public function test_confirmar_con_un_periodo_sin_ciclo_espejo_da_un_error_de_validacion_no_un_500(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $periodoHuerfano = Periodo::factory()->create();
        $carrera = Carrera::factory()->create();

        $this->actingAs($usuario);

        // periodoId se fuerza a mano (bypass del selector, que ya lo
        // excluye) para simular el registro inconsistente directamente.
        $this->wizardEnPasoDeMatricula('55667803')
            ->set('periodoId', (string) $periodoHuerfano->id)
            ->set('carreraId', (string) $carrera->id)
            ->set('cicloCurricular', '1')
            ->call('confirmar')
            ->assertHasErrors(['periodoId']);

        $this->assertDatabaseCount('estudiantes', 0);
    }

    public function test_cancelar_el_wizard_dispara_el_evento_que_cierra_el_modal(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario);

        Volt::test('matricula.wizard')
            ->call('cancelar')
            ->assertDispatched('wizard-cerrado');
    }

    public function test_el_buscador_de_estudiantes_muestra_sugerencias_y_filtra(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        Estudiante::factory()->create(['nombres' => 'Fabiola', 'apellidos' => 'Reyes Nunez']);
        Estudiante::factory()->create(['nombres' => 'Gonzalo', 'apellidos' => 'Torres Diaz']);

        $this->actingAs($usuario);

        $html = Volt::test('matricula.index')->html();
        $this->assertStringContainsString('\u0022label\u0022:\u0022Fabiola Reyes Nunez\u0022', $html);
        $this->assertStringContainsString('\u0022label\u0022:\u0022Gonzalo Torres Diaz\u0022', $html);

        Volt::test('matricula.index')
            ->set('termino', 'Fabiola')
            ->assertSee('Fabiola Reyes Nunez')
            ->assertDontSee('Gonzalo Torres Diaz');
    }

    public function test_el_listado_abre_y_cierra_el_modal_del_wizard(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $this->actingAs($usuario);

        Volt::test('matricula.index')
            ->assertSet('mostrarWizard', false)
            ->set('mostrarWizard', true)
            ->assertSet('mostrarWizard', true)
            ->call('cerrarWizard')
            ->assertSet('mostrarWizard', false);
    }

    public function test_guardar_observaciones_desde_la_pagina_completa_de_la_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['observaciones' => null]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->set('observacionesTexto', 'Promete traer la partida de nacimiento la próxima semana.')
            ->call('guardarObservaciones')
            ->assertHasNoErrors();

        $this->assertSame(
            'Promete traer la partida de nacimiento la próxima semana.',
            $estudiante->fresh()->observaciones
        );
    }

    public function test_guardar_observaciones_desde_el_modal_de_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['observaciones' => null]);

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->set('observacionesTexto', 'Rindió examen de ubicación, resultado pendiente.')
            ->call('guardarObservaciones')
            ->assertHasNoErrors();

        $this->assertSame(
            'Rindió examen de ubicación, resultado pendiente.',
            $estudiante->fresh()->observaciones
        );
    }

    public function test_guardar_datos_personales_desde_la_pagina_completa_de_la_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create([
            'nombres' => 'Ana',
            'apellidos' => 'Quispe Mamani',
            'celular' => '900000000',
            'email' => null,
            'direccion' => null,
            'estado_civil' => null,
        ]);
        $nuevaFechaNacimiento = now()->subYears(22)->format('Y-m-d');

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->assertSet('nombresNuevo', 'Ana')
            ->assertSet('apellidosNuevo', 'Quispe Mamani')
            ->set('nombresNuevo', 'Ana Lucía')
            ->set('fechaNacimientoNueva', $nuevaFechaNacimiento)
            ->set('estadoCivilNuevo', EstadoCivilEnum::CASADO->value)
            ->set('celularNuevo', '911111111')
            ->set('emailNuevo', 'ana.quispe@example.com')
            ->set('direccionNueva', 'Av. Siempre Viva 123')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $estudiante->refresh();
        $this->assertSame('Ana Lucía', $estudiante->nombres);
        $this->assertSame($nuevaFechaNacimiento, $estudiante->fecha_nacimiento->format('Y-m-d'));
        $this->assertSame(EstadoCivilEnum::CASADO, $estudiante->estado_civil);
        $this->assertSame('911111111', $estudiante->celular);
        $this->assertSame('ana.quispe@example.com', $estudiante->email);
        $this->assertSame('Av. Siempre Viva 123', $estudiante->direccion);
    }

    public function test_guardar_datos_personales_desde_el_modal_de_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['celular' => '900000000']);

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->call('editarDatosPersonales')
            ->set('celularNuevo', '922222222')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $this->assertSame('922222222', $estudiante->fresh()->celular);
    }

    public function test_guardar_datos_personales_sin_estado_civil_lo_deja_nulo(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['estado_civil' => EstadoCivilEnum::SOLTERO]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('estadoCivilNuevo', '')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $this->assertNull($estudiante->fresh()->estado_civil);
    }

    public function test_no_se_puede_editar_datos_personales_sin_el_permiso_de_editar_matricula(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);
        $estudiante = Estudiante::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->assertForbidden();
    }

    public function test_corregir_un_dni_mal_tipeado_actualiza_tambien_el_correo_institucional(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $cuentaEstudiante = User::factory()->create([
            'dni' => '55667711',
            'email' => '55667711@iesamericalibertad.com',
        ]);
        $estudiante = Estudiante::factory()->create([
            'user_id' => $cuentaEstudiante->id,
            'dni' => '55667711',
            'email' => '55667711@iesamericalibertad.com',
        ]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('dniNuevo', '55667712')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $estudiante->refresh();
        $cuentaEstudiante->refresh();
        $this->assertSame('55667712', $estudiante->dni);
        $this->assertSame('55667712@iesamericalibertad.com', $estudiante->email);
        $this->assertSame('55667712', $cuentaEstudiante->dni);
        $this->assertSame('55667712@iesamericalibertad.com', $cuentaEstudiante->email);
    }

    public function test_dejar_el_dni_igual_respeta_un_correo_de_contacto_editado_a_mano(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create(['dni' => '55667713']);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('emailNuevo', 'contacto.personal@example.com')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $this->assertSame('contacto.personal@example.com', $estudiante->fresh()->email);
    }

    public function test_no_se_puede_corregir_el_dni_a_uno_ya_usado_por_otro_estudiante(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        Estudiante::factory()->create(['dni' => '55667714']);
        $estudiante = Estudiante::factory()->create(['dni' => '55667715']);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('dniNuevo', '55667714')
            ->call('guardarDatosPersonales')
            ->assertHasErrors(['dniNuevo']);

        $this->assertSame('55667715', $estudiante->fresh()->dni);
    }

    public function test_no_se_puede_corregir_el_dni_a_uno_ya_usado_por_otra_cuenta_de_acceso(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        User::factory()->create(['dni' => '55667716']);
        $estudiante = Estudiante::factory()->create(['dni' => '55667717']);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('dniNuevo', '55667716')
            ->call('guardarDatosPersonales')
            ->assertHasErrors(['dniNuevo']);

        $this->assertSame('55667717', $estudiante->fresh()->dni);
    }

    public function test_un_dni_con_formato_invalido_muestra_error_de_validacion(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarDatosPersonales')
            ->set('dniNuevo', '123')
            ->call('guardarDatosPersonales')
            ->assertHasErrors(['dniNuevo']);
    }

    public function test_corregir_dni_desde_el_modal_de_ficha_tambien_actualiza_el_correo(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $cuentaEstudiante = User::factory()->create([
            'dni' => '55667718',
            'email' => '55667718@iesamericalibertad.com',
        ]);
        $estudiante = Estudiante::factory()->create([
            'user_id' => $cuentaEstudiante->id,
            'dni' => '55667718',
            'email' => '55667718@iesamericalibertad.com',
        ]);

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->call('editarDatosPersonales')
            ->set('dniNuevo', '55667719')
            ->call('guardarDatosPersonales')
            ->assertHasNoErrors();

        $this->assertSame('55667719', $estudiante->fresh()->dni);
        $this->assertSame('55667719@iesamericalibertad.com', $cuentaEstudiante->fresh()->email);
    }

    public function test_editar_fecha_fin_estudio_desde_la_pagina_completa_de_la_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $nuevaFecha = now()->addMonths(6)->format('Y-m-d');

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarFechaFinEstudio', $matricula->id)
            ->set('fechaFinEstudioNueva', $nuevaFecha)
            ->call('guardarFechaFinEstudio')
            ->assertHasNoErrors();

        $this->assertSame($nuevaFecha, $matricula->fresh()->fecha_fin_estudio->format('Y-m-d'));
    }

    public function test_editar_fecha_fin_estudio_desde_el_modal_de_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $nuevaFecha = now()->addMonths(6)->format('Y-m-d');

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->call('editarFechaFinEstudio', $matricula->id)
            ->set('fechaFinEstudioNueva', $nuevaFecha)
            ->call('guardarFechaFinEstudio')
            ->assertHasNoErrors();

        $this->assertSame($nuevaFecha, $matricula->fresh()->fecha_fin_estudio->format('Y-m-d'));
    }

    public function test_no_se_puede_editar_fecha_fin_estudio_sin_el_permiso_de_editar_matricula(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarFechaFinEstudio', $matricula->id)
            ->assertForbidden();
    }

    public function test_editar_horario_desde_la_ficha_asigna_el_horario_de_ese_curso(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $ciclo = Ciclo::factory()->activo()->create();
        $carrera = Carrera::factory()->create();
        $curso = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1]);
        $seccionA = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);
        $seccionB = Horario::factory()->create(['curso_id' => $curso->id, 'ciclo_id' => $ciclo->id]);
        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
        ]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarHorario', $matricula->id, $curso->id)
            ->set('horarioSeleccionado', (string) $seccionB->id)
            ->call('guardarHorario')
            ->assertHasNoErrors();

        $this->assertSame([$seccionB->id], $matricula->fresh()->horarios->pluck('id')->all());
        $this->assertFalse($matricula->fresh()->horarios->pluck('id')->contains($seccionA->id));
    }

    public function test_la_ficha_muestra_el_curso_en_recuperacion_con_su_propio_ciclo_y_estado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $carrera = Carrera::factory()->create();
        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 2,
        ]);
        // El curso jalado es de un ciclo_curricular distinto (menor) al de
        // la matrícula -- justo lo que debe verse en la ficha.
        $cursoJalado = Curso::factory()->create(['carrera_id' => $carrera->id, 'ciclo_curricular' => 1, 'nombre' => 'Anatomía I']);
        $horarioDeRefuerzo = Horario::factory()->create(['curso_id' => $cursoJalado->id]);
        MatriculaRefuerzo::factory()->create([
            'matricula_id' => $matricula->id,
            'curso_id' => $cursoJalado->id,
            'horario_id' => $horarioDeRefuerzo->id,
            'estado' => EstadoRefuerzoEnum::CURSANDO,
        ]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->assertSee('Cursos en recuperación')
            ->assertSee('Anatomía I')
            ->assertSee('ciclo I')
            ->assertSee('Cursando');
    }

    public function test_no_se_puede_editar_horario_sin_el_permiso_de_editar_matricula(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);

        $ciclo = Ciclo::factory()->activo()->create();
        $carrera = Carrera::factory()->create();
        $horario = Horario::factory()->create(['ciclo_id' => $ciclo->id]);
        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'ciclo_id' => $ciclo->id,
            'carrera_id' => $carrera->id,
            'ciclo_curricular' => 1,
        ]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarHorario', $matricula->id, $horario->curso_id)
            ->assertForbidden();
    }

    public function test_editar_monto_del_plan_de_pago_desde_la_pagina_completa_de_la_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $plan = PlanPago::factory()->create(['matricula_id' => $matricula->id, 'monto_total' => 600]);
        $plan->cuotas()->create(['numero' => 1, 'monto' => 300, 'fecha_vencimiento' => now()->addMonth(), 'estado' => 'pagado']);
        $plan->cuotas()->create(['numero' => 2, 'monto' => 300, 'fecha_vencimiento' => now()->addMonths(2), 'estado' => 'pendiente']);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarMontoPlan', $plan->id)
            ->set('montoTotalNuevo', '900')
            ->call('guardarMontoPlan')
            ->assertHasNoErrors();

        $plan->refresh();
        $this->assertSame('900.00', $plan->monto_total);
        $this->assertSame('300.00', $plan->cuotas()->where('numero', 1)->first()->monto);
        $this->assertSame('600.00', $plan->cuotas()->where('numero', 2)->first()->monto);
    }

    public function test_editar_monto_del_plan_de_pago_desde_el_modal_de_ficha(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $plan = PlanPago::factory()->create(['matricula_id' => $matricula->id, 'monto_total' => 600]);
        $plan->cuotas()->create(['numero' => 1, 'monto' => 600, 'fecha_vencimiento' => now()->addMonth(), 'estado' => 'pendiente']);

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->call('editarMontoPlan', $plan->id)
            ->set('montoTotalNuevo', '450')
            ->call('guardarMontoPlan')
            ->assertHasNoErrors();

        $this->assertSame('450.00', $plan->fresh()->monto_total);
    }

    public function test_no_se_puede_editar_monto_del_plan_de_pago_sin_el_permiso_de_gestionar_pagos(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $plan = PlanPago::factory()->create(['matricula_id' => $matricula->id]);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarMontoPlan', $plan->id)
            ->assertForbidden();
    }

    public function test_editar_monto_menor_a_lo_ya_pagado_muestra_error(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);

        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        $plan = PlanPago::factory()->create(['matricula_id' => $matricula->id, 'monto_total' => 600]);
        $plan->cuotas()->create(['numero' => 1, 'monto' => 300, 'fecha_vencimiento' => now()->addMonth(), 'estado' => 'pagado']);
        $plan->cuotas()->create(['numero' => 2, 'monto' => 300, 'fecha_vencimiento' => now()->addMonths(2), 'estado' => 'pendiente']);

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('editarMontoPlan', $plan->id)
            ->set('montoTotalNuevo', '100')
            ->call('guardarMontoPlan')
            ->assertHasErrors(['montoTotal']);

        $this->assertSame('600.00', $plan->fresh()->monto_total);
    }

    public function test_subir_un_documento_que_nunca_se_cargo_desde_la_pagina_completa_de_la_ficha(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('mostrarFormularioDocumento', TipoDocumentoEnum::CERTIFICADO_ESTUDIOS->value)
            ->set('documentoCaraArchivo', UploadedFile::fake()->create('certificado.pdf', 100, 'application/pdf'))
            ->call('guardarDocumento')
            ->assertHasNoErrors();

        $documento = $estudiante->documentos()->where('tipo', TipoDocumentoEnum::CERTIFICADO_ESTUDIOS->value)->firstOrFail();
        $this->assertNotNull($documento->getFirstMedia('archivo'));
        $this->assertFalse($documento->verificado);
    }

    public function test_reemplazar_un_documento_ya_subido_desde_el_modal_de_ficha_resetea_la_verificacion(): void
    {
        Storage::fake('public');

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::COORDINADOR->value);
        $estudiante = Estudiante::factory()->create();

        $documentoService = $this->app->make(DocumentoEstudianteService::class);
        $documento = $documentoService->subir(
            $estudiante,
            TipoDocumentoEnum::DNI_ESTUDIANTE,
            UploadedFile::fake()->image('cara-original.jpg'),
            $usuario->id,
        );
        $documento->update(['verificado' => true]);

        $this->actingAs($usuario);

        Volt::test('matricula.ficha-modal')
            ->call('abrir', $estudiante->id)
            ->call('mostrarFormularioDocumento', TipoDocumentoEnum::DNI_ESTUDIANTE->value)
            ->set('documentoCaraArchivo', UploadedFile::fake()->image('cara-nueva.jpg'))
            ->call('guardarDocumento')
            ->assertHasNoErrors();

        $this->assertSame(1, $estudiante->documentos()->where('tipo', TipoDocumentoEnum::DNI_ESTUDIANTE->value)->count());
        $documento->refresh();
        $this->assertFalse($documento->verificado);
    }

    public function test_no_se_puede_subir_un_documento_desde_la_ficha_sin_el_permiso_de_editar_matricula(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);
        $estudiante = Estudiante::factory()->create();

        $this->actingAs($usuario);

        Volt::test('matricula.show', ['estudiante' => $estudiante])
            ->call('mostrarFormularioDocumento', TipoDocumentoEnum::CERTIFICADO_ESTUDIOS->value)
            ->assertForbidden();
    }
}
