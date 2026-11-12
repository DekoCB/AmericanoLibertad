<?php

namespace Tests\Feature\Pagos;

use App\Models\User;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Enums\SerieReciboEnum;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Services\ReciboService;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReciboTicketTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function service(): ReciboService
    {
        return $this->app->make(ReciboService::class);
    }

    public function test_el_ticket_80mm_incluye_los_datos_clave_y_no_la_caja_dia_mes_ano(): void
    {
        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $html = view('pdf.recibo-ticket', [
            'pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL, 'anchoMm' => 80, 'altoMm' => 150,
        ])->render();

        $this->assertStringContainsString($pago->estudiante->nombreCompleto(), $html);
        $this->assertStringContainsString($pago->estudiante->dni, $html);
        $this->assertStringContainsString(number_format((float) $pago->monto, 2), $html);
        $this->assertStringNotContainsString('Día', $html);
        $this->assertStringNotContainsString('Mes', $html);
        $this->assertStringNotContainsString('Año', $html);
    }

    public function test_el_ticket_58mm_incluye_los_datos_clave_y_no_la_caja_dia_mes_ano(): void
    {
        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $html = view('pdf.recibo-ticket', [
            'pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL, 'anchoMm' => 58, 'altoMm' => 150,
        ])->render();

        $this->assertStringContainsString($pago->estudiante->nombreCompleto(), $html);
        $this->assertStringContainsString($pago->estudiante->dni, $html);
        $this->assertStringNotContainsString('Día', $html);
    }

    public function test_renderizar_ticket_no_persiste_ni_crea_media(): void
    {
        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $pdfBytes = $this->service()->renderizarTicket($recibo, 80);

        $this->assertNotEmpty($pdfBytes);
        $this->assertCount(1, $recibo->fresh()->getMedia('pdf'));
    }

    public function test_la_altura_estimada_crece_con_una_observacion_larga(): void
    {
        $pagoCorto = Pago::factory()->create(['observacion' => null]);
        $pagoLargo = Pago::factory()->create([
            'observacion' => 'Pago correspondiente a la mensualidad de octubre, incluye recargo por mora de los días 1 al 5 según política institucional vigente.',
        ]);

        $altoCorto = $this->service()->alturaTicketMm($pagoCorto, 58);
        $altoLargo = $this->service()->alturaTicketMm($pagoLargo, 58);

        $this->assertGreaterThan($altoCorto, $altoLargo);
    }

    public function test_la_altura_estimada_de_un_pago_simple_no_deja_un_margen_excesivo(): void
    {
        $pago = Pago::factory()->create(['observacion' => null]);

        $alto = $this->service()->alturaTicketMm($pago, 80);

        // Antes se usaba un alto fijo de 400mm sin importar el contenido --
        // un recibo simple (aun con el encabezado y los totales completos) queda muy por debajo.
        $this->assertLessThan(220, $alto);
    }

    public function test_la_ruta_de_ticket_devuelve_un_pdf_para_un_administrativo(): void
    {
        $administrativo = User::factory()->create();
        $administrativo->assignRole(RolEnum::ADMINISTRATIVO->value);

        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $this->actingAs($administrativo)
            ->get(route('pagos.recibos.ticket', [$recibo, 80]))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_un_estudiante_puede_generar_el_ticket_de_su_propio_pago(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        $estudiante = Estudiante::factory()->create(['user_id' => $usuario->id]);

        $pago = Pago::factory()->create(['estudiante_id' => $estudiante->id]);
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $this->actingAs($usuario)
            ->get(route('pagos.recibos.ticket', [$recibo, 58]))
            ->assertOk();
    }

    public function test_un_estudiante_no_puede_generar_el_ticket_del_pago_de_otro_estudiante(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ESTUDIANTE->value);
        Estudiante::factory()->create(['user_id' => $usuario->id]);

        $otroEstudiante = Estudiante::factory()->create();
        $pago = Pago::factory()->create(['estudiante_id' => $otroEstudiante->id]);
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $this->actingAs($usuario)
            ->get(route('pagos.recibos.ticket', [$recibo, 80]))
            ->assertForbidden();
    }

    public function test_un_docente_no_puede_generar_ningun_ticket(): void
    {
        $docente = User::factory()->create();
        $docente->assignRole(RolEnum::DOCENTE->value);

        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $this->actingAs($docente)
            ->get(route('pagos.recibos.ticket', [$recibo, 80]))
            ->assertForbidden();
    }

    public function test_el_ticket_muestra_el_detalle_completo_de_la_boleta(): void
    {
        config(['institucion.ruc' => '20123456789']);

        $pago = Pago::factory()->create(['monto' => 230, 'observacion' => '2.ª pensión de agosto']);
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $html = view('pdf.recibo-ticket', [
            'pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL, 'anchoMm' => 80, 'altoMm' => 200,
        ])->render();

        $this->assertStringContainsString('RUC: 20123456789', $html);
        $this->assertStringContainsString('BOLETA', $html);
        $this->assertStringContainsString('001-000001', $html);
        $this->assertStringContainsString('H. EMISIÓN', $html);
        $this->assertStringContainsString('VALOR DE VENTA', $html);
        $this->assertStringContainsString('TOTAL A PAGAR', $html);
        $this->assertStringContainsString('SON: DOSCIENTOS TREINTA CON 00/100 SOLES', $html);
        $this->assertStringContainsString('2.ª pensión de agosto', $html);
        $this->assertStringContainsString('Gracias por su pago', $html);
    }

    public function test_sin_ruc_configurado_no_imprime_la_linea_de_ruc(): void
    {
        config(['institucion.ruc' => '']);

        $pago = Pago::factory()->create();
        $recibo = $this->service()->emitir($pago, SerieReciboEnum::ORIGINAL);

        $html = view('pdf.recibo-ticket', [
            'pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL, 'anchoMm' => 58, 'altoMm' => 200,
        ])->render();

        $this->assertStringNotContainsString('RUC:', $html);
    }
}
