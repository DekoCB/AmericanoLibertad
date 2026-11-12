<?php

namespace Tests\Feature\Pagos;

use App\Models\User;
use App\Modules\Identidad\Database\Seeders\RolesAndPermissionsSeeder;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Enums\OrigenPagoEnum;
use App\Modules\Pagos\Enums\SerieReciboEnum;
use App\Modules\Pagos\Models\ConceptoPago;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Services\ReciboService;
use App\Shared\Enums\RolEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Volt\Volt;
use Tests\TestCase;

class OrigenNumeroOperacionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function administrativo(): User
    {
        $usuario = User::factory()->create();
        $usuario->assignRole(RolEnum::ADMINISTRATIVO->value);

        return $usuario;
    }

    public function test_un_pago_por_yape_exige_origen_y_numero_de_operacion(): void
    {
        $estudiante = Estudiante::factory()->create();
        $concepto = ConceptoPago::factory()->create();

        $this->actingAs($this->administrativo());

        Volt::test('pagos.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('conceptoId', (string) $concepto->id)
            ->set('partes.0.monto', '230')
            ->set('partes.0.metodo', 'yape')
            ->call('registrarPago')
            ->assertHasErrors(['origen', 'numeroOperacion']);

        $this->assertDatabaseCount('pagos', 0);
    }

    public function test_el_origen_debe_corresponder_al_metodo(): void
    {
        $estudiante = Estudiante::factory()->create();
        $concepto = ConceptoPago::factory()->create();

        $this->actingAs($this->administrativo());

        Volt::test('pagos.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('conceptoId', (string) $concepto->id)
            ->set('partes.0.monto', '230')
            ->set('partes.0.metodo', 'yape')
            ->set('origen', 'ventanilla')
            ->set('numeroOperacion', '16221931')
            ->call('registrarPago')
            ->assertHasErrors(['origen']);
    }

    public function test_un_pago_por_yape_guarda_origen_y_numero_de_operacion(): void
    {
        $estudiante = Estudiante::factory()->create();
        $concepto = ConceptoPago::factory()->create();

        $this->actingAs($this->administrativo());

        Volt::test('pagos.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('conceptoId', (string) $concepto->id)
            ->set('partes.0.monto', '230')
            ->set('partes.0.metodo', 'yape')
            ->set('origen', 'pago_qr')
            ->set('numeroOperacion', ' 16221931 ')
            ->call('registrarPago')
            ->assertHasNoErrors();

        $pago = Pago::query()->where('estudiante_id', $estudiante->id)->firstOrFail();
        $this->assertSame(OrigenPagoEnum::PAGO_QR, $pago->origen);
        $this->assertSame('16221931', $pago->numero_operacion);
    }

    public function test_un_pago_en_efectivo_queda_como_ventanilla_sin_numero_de_operacion(): void
    {
        $estudiante = Estudiante::factory()->create();
        $concepto = ConceptoPago::factory()->create();

        $this->actingAs($this->administrativo());

        Volt::test('pagos.index')
            ->call('seleccionarEstudiante', $estudiante->id, $estudiante->nombreCompleto())
            ->set('conceptoId', (string) $concepto->id)
            ->set('partes.0.monto', '100')
            ->set('partes.0.metodo', 'efectivo')
            ->call('registrarPago')
            ->assertHasNoErrors();

        $pago = Pago::query()->where('estudiante_id', $estudiante->id)->firstOrFail();
        $this->assertSame(OrigenPagoEnum::VENTANILLA, $pago->origen);
        $this->assertNull($pago->numero_operacion);
    }

    public function test_la_boleta_imprime_origen_y_numero_de_operacion(): void
    {
        $pago = Pago::factory()->create(['origen' => OrigenPagoEnum::PAGO_QR, 'numero_operacion' => '16221931']);
        $recibo = $this->app->make(ReciboService::class)->emitir($pago, SerieReciboEnum::ORIGINAL);

        $ticket = view('pdf.recibo-ticket', [
            'pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL, 'anchoMm' => 80, 'altoMm' => 200,
        ])->render();
        $a4 = view('pdf.recibo', ['pago' => $pago, 'recibo' => $recibo, 'serie' => SerieReciboEnum::ORIGINAL])->render();

        $this->assertStringContainsString('PAGO QR', $ticket);
        $this->assertStringContainsString('16221931', $ticket);
        $this->assertStringContainsString('Pago QR', $a4);
        $this->assertStringContainsString('16221931', $a4);
    }
}
