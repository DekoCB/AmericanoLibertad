<?php

namespace Tests\Feature\Evaluaciones;

use App\Models\User;
use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Volt\Volt;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class EvaluacionesFlujoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function service(): EvaluacionService
    {
        return $this->app->make(EvaluacionService::class);
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

    public function test_el_docente_crea_una_continua_desde_el_modo_crear(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('irACrear')
            ->set('nuevaFecha', '2026-07-15')
            ->call('guardarContinua')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('evaluaciones', [
            'horario_id' => $horario->id,
            'mitad' => 'primera',
            'tipo' => 'continua',
            'nombre' => 'C1',
        ]);
    }

    public function test_crear_una_continua_con_nombre_personalizado_lo_persiste(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('irACrear')
            ->set('nuevoNombre', 'Trabajo en grupo')
            ->set('nuevaFecha', '2026-07-15')
            ->call('guardarContinua')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('evaluaciones', [
            'horario_id' => $horario->id,
            'nombre' => 'Trabajo en grupo',
        ]);
    }

    public function test_el_docente_edita_una_continua_existente(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, 'C1', '2026-07-15');

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('editarContinua', $continua->id)
            ->assertSet('nuevoNombre', 'C1')
            ->assertSet('continuaEditandoId', $continua->id)
            ->set('nuevoNombre', 'C1 corregida')
            ->set('nuevaFecha', '2026-07-20')
            ->call('guardarContinua')
            ->assertHasNoErrors();

        $this->assertDatabaseCount('evaluaciones', 3); // la continua editada + los 2 exámenes sembrados
        $this->assertDatabaseHas('evaluaciones', [
            'id' => $continua->id,
            'nombre' => 'C1 corregida',
            'fecha' => '2026-07-20 00:00:00',
        ]);
    }

    public function test_el_docente_elimina_una_continua(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, 'C1', '2026-07-15');

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('eliminarContinua', $continua->id)
            ->assertHasNoErrors();

        $this->assertDatabaseMissing('evaluaciones', ['id' => $continua->id]);
    }

    public function test_un_docente_no_puede_eliminar_una_continua_de_otro_horario(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $otroHorario = Horario::factory()->create();
        $continuaAjena = $this->service()->crearContinua($otroHorario, MitadCicloEnum::PRIMERA, 'C1', '2026-07-15');

        $this->actingAs($docente);

        rescue(fn () => Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('eliminarContinua', $continuaAjena->id), report: false);

        $this->assertDatabaseHas('evaluaciones', ['id' => $continuaAjena->id]);
    }

    public function test_un_estudiante_no_puede_crear_una_continua(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $this->actingAs($usuario);

        rescue(fn () => Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('irACrear'), report: false);

        $this->assertDatabaseCount('evaluaciones', 0);
    }

    public function test_el_docente_registra_notas_en_una_continua(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $estudiante = $this->matricular($horario);
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set("notas.{$estudiante->id}.{$continua->id}", '17.5')
            ->call('guardarNotas')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('calificaciones', [
            'evaluacion_id' => $continua->id,
            'estudiante_id' => $estudiante->id,
            'nota_numerica' => 17.5,
        ]);
    }

    public function test_el_docente_registra_notas_en_el_examen(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $estudiante = $this->matricular($horario);

        $this->actingAs($docente);

        $resultado = Volt::test('evaluaciones.show', ['horario' => $horario]);
        $examen = Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', MitadCicloEnum::PRIMERA)
            ->where('tipo', TipoEvaluacionEnum::EXAMEN)
            ->firstOrFail();

        $resultado->set("notas.{$estudiante->id}.{$examen->id}", '16')
            ->call('guardarNotas')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('calificaciones', [
            'evaluacion_id' => $examen->id,
            'estudiante_id' => $estudiante->id,
            'nota_numerica' => 16,
        ]);
    }

    /**
     * @param  list<string>  $encabezados
     * @param  list<list<string>>  $filas
     */
    private function archivoExcel(array $encabezados, array $filas): UploadedFile
    {
        $hoja = new Spreadsheet;
        $hoja->getActiveSheet()->fromArray($encabezados, null, 'A1');
        $hoja->getActiveSheet()->fromArray($filas, null, 'A2');

        $ruta = tempnam(sys_get_temp_dir(), 'notas_test_').'.xlsx';
        (new Xlsx($hoja))->save($ruta);

        $archivo = UploadedFile::fake()->createWithContent('notas.xlsx', file_get_contents($ruta));
        unlink($ruta);

        return $archivo;
    }

    public function test_el_docente_importa_notas_desde_un_archivo_hacia_la_columna_elegida(): void
    {
        Storage::fake('local');

        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $estudiante = Estudiante::factory()->create(['dni' => '87654321']);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $this->actingAs($docente);

        $archivo = $this->archivoExcel(['dni', 'nota', 'observaciones'], [
            ['87654321', '18.5', 'Importado'],
        ]);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set('columnaImportar', (string) $continua->id)
            ->set('archivoNotas', $archivo)
            ->call('importarNotas')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('calificaciones', [
            'evaluacion_id' => $continua->id,
            'estudiante_id' => $estudiante->id,
            'nota_numerica' => 18.5,
            'observaciones' => 'Importado',
        ]);
    }

    public function test_un_docente_dueno_de_otro_horario_no_puede_importar_notas(): void
    {
        Storage::fake('local');

        $docenteOwner = User::factory()->create();
        $docenteOwner->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docenteOwner->id]);
        $this->service()->sembrarExamenes($horario);

        $otroDocente = User::factory()->create();
        $otroDocente->assignRole(RolEnum::DOCENTE->value);

        $this->actingAs($otroDocente);

        $archivo = $this->archivoExcel(['dni', 'nota'], [['12345678', '15']]);

        rescue(fn () => Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set('archivoNotas', $archivo)
            ->call('importarNotas'), report: false);

        $this->assertDatabaseCount('calificaciones', 0);
    }

    public function test_no_permite_registrar_una_nota_fuera_del_rango_0_20(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $estudiante = $this->matricular($horario);
        $continua = $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set("notas.{$estudiante->id}.{$continua->id}", '25')
            ->call('guardarNotas')
            ->assertHasErrors(["notas.{$estudiante->id}.{$continua->id}"]);
    }

    public function test_el_docente_guarda_y_luego_actualiza_el_enlace_del_examen(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set('enlaceExamen', 'https://forms.test/examen')
            ->call('guardarFechaExamen')
            ->assertHasNoErrors();

        $evaluacionExamen = Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', MitadCicloEnum::PRIMERA)
            ->where('tipo', TipoEvaluacionEnum::EXAMEN)
            ->firstOrFail();

        $this->assertDatabaseHas('evaluaciones', [
            'id' => $evaluacionExamen->id,
            'enlace_externo' => 'https://forms.test/examen',
        ]);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set('enlaceExamen', 'https://forms.test/actualizado')
            ->call('guardarFechaExamen')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('evaluaciones', [
            'id' => $evaluacionExamen->id,
            'enlace_externo' => 'https://forms.test/actualizado',
        ]);
    }

    public function test_no_permite_un_enlace_externo_invalido(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->set('enlaceExamen', 'no-es-una-url')
            ->call('guardarFechaExamen')
            ->assertHasErrors(['enlaceExamen']);
    }

    public function test_un_estudiante_matriculado_no_ve_el_enlace_de_un_examen_en_borrador(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $this->service()->sembrarExamenes($horario);
        $examen = $this->service()->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $this->service()->actualizarEnlace($examen, 'https://forms.test/examen');

        $this->actingAs($usuario);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->assertDontSee('Evaluaciones para rendir')
            ->assertDontSee('https://forms.test/examen');
    }

    public function test_un_estudiante_matriculado_ve_el_enlace_recien_cuando_se_publica_la_mitad(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);

        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);
        Matricula::factory()->create([
            'estudiante_id' => $estudiante->id,
            'carrera_id' => $horario->carrera_id,
            'ciclo_curricular' => $horario->ciclo_curricular,
            'ciclo_id' => $horario->ciclo_id,
        ]);

        $this->service()->sembrarExamenes($horario);
        $examen = $this->service()->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $this->service()->actualizarEnlace($examen, 'https://forms.test/examen');
        $this->service()->publicarMitad($horario, MitadCicloEnum::PRIMERA);

        $this->actingAs($usuario);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->assertSee('Evaluaciones para rendir')
            ->assertSee('https://forms.test/examen');
    }

    public function test_el_docente_ve_las_continuas_y_el_examen_de_la_mitad_actual_en_orden(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-15');
        $this->service()->crearContinua($horario, MitadCicloEnum::PRIMERA, null, '2026-07-16');

        $this->actingAs($docente);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->assertSeeInOrder(['C1', 'C2', 'Examen parcial']);
    }

    public function test_el_docente_puede_cambiar_a_la_mitad_segunda(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $estudiante = $this->matricular($horario);

        $this->actingAs($docente);

        $component = Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('cambiarMitad', 'segunda');

        $examenSegunda = Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', MitadCicloEnum::SEGUNDA)
            ->where('tipo', TipoEvaluacionEnum::EXAMEN)
            ->firstOrFail();

        $component->set("notas.{$estudiante->id}.{$examenSegunda->id}", '19')
            ->call('guardarNotas')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('calificaciones', [
            'evaluacion_id' => $examenSegunda->id,
            'estudiante_id' => $estudiante->id,
            'nota_numerica' => 19,
        ]);
    }

    public function test_publicar_mitad_marca_el_examen_de_esa_mitad_como_publicado(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);
        $horario = Horario::factory()->create(['docente_id' => $docente->id]);
        $coordinador = User::factory()->create();
        $coordinador->assignRole(RolEnum::COORDINADOR->value);
        $this->service()->sembrarExamenes($horario);

        $this->actingAs($coordinador);

        Volt::test('evaluaciones.show', ['horario' => $horario])
            ->call('publicarMitad')
            ->assertHasNoErrors();

        $examen = $this->service()->examenDeLaMitad($horario, MitadCicloEnum::PRIMERA);
        $this->assertSame(EstadoEvaluacionEnum::PUBLICADA, $examen->fresh()->estado);
    }
}
