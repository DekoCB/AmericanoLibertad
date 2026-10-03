<?php

namespace Tests\Feature\Pagos;

use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Enums\EstadoCuotaEnum;
use App\Modules\Pagos\Models\CargoAdicional;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Services\CargoAdicionalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CargoAdicionalServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): CargoAdicionalService
    {
        return $this->app->make(CargoAdicionalService::class);
    }

    public function test_crear_un_cargo_adicional_queda_pendiente(): void
    {
        $estudiante = Estudiante::factory()->create();

        $cargo = $this->service()->crear($estudiante, 'Convalidación', 150.0, null);

        $this->assertSame($estudiante->id, $cargo->estudiante_id);
        $this->assertSame('Convalidación', $cargo->concepto);
        $this->assertSame('150.00', $cargo->monto);
        $this->assertSame(EstadoCuotaEnum::PENDIENTE, $cargo->estado);
    }

    public function test_no_permite_crear_un_cargo_con_monto_cero_o_negativo(): void
    {
        $estudiante = Estudiante::factory()->create();

        $this->expectException(ValidationException::class);

        $this->service()->crear($estudiante, 'Exoneración', 0.0, null);
    }

    public function test_editar_monto_no_permite_bajar_de_lo_ya_pagado(): void
    {
        $cargo = CargoAdicional::factory()->create(['monto' => 100]);
        Pago::factory()->aprobado()->create(['estudiante_id' => $cargo->estudiante_id, 'cargo_adicional_id' => $cargo->id, 'monto' => 60]);

        $this->expectException(ValidationException::class);

        $this->service()->editarMonto($cargo, 50.0);
    }

    public function test_editar_monto_de_un_cargo_pagado_lo_vuelve_a_pendiente_si_sube_el_monto(): void
    {
        $cargo = CargoAdicional::factory()->pagado()->create(['monto' => 100]);
        Pago::factory()->aprobado()->create(['estudiante_id' => $cargo->estudiante_id, 'cargo_adicional_id' => $cargo->id, 'monto' => 100]);

        $actualizado = $this->service()->editarMonto($cargo, 150.0);

        $this->assertSame('150.00', $actualizado->monto);
        $this->assertSame(EstadoCuotaEnum::PENDIENTE, $actualizado->estado);
    }

    public function test_editar_monto_de_un_cargo_pagado_que_cubre_el_nuevo_monto_sigue_pagado(): void
    {
        $cargo = CargoAdicional::factory()->pagado()->create(['monto' => 100]);
        Pago::factory()->aprobado()->create(['estudiante_id' => $cargo->estudiante_id, 'cargo_adicional_id' => $cargo->id, 'monto' => 100]);

        $actualizado = $this->service()->editarMonto($cargo, 100.0);

        $this->assertSame(EstadoCuotaEnum::PAGADO, $actualizado->estado);
        $this->assertSame(0.0, $actualizado->saldoPendiente());
    }
}
