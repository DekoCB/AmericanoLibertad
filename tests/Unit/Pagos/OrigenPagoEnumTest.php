<?php

namespace Tests\Unit\Pagos;

use App\Modules\Pagos\Enums\MetodoPagoEnum;
use App\Modules\Pagos\Enums\OrigenPagoEnum;
use PHPUnit\Framework\TestCase;

class OrigenPagoEnumTest extends TestCase
{
    public function test_efectivo_solo_admite_ventanilla_y_no_pide_numero(): void
    {
        $this->assertSame([OrigenPagoEnum::VENTANILLA], OrigenPagoEnum::disponiblesPara([MetodoPagoEnum::EFECTIVO]));
        $this->assertFalse(OrigenPagoEnum::requiereNumeroOperacion([MetodoPagoEnum::EFECTIVO]));
    }

    public function test_yape_admite_qr_o_transferencia_y_pide_numero(): void
    {
        $this->assertSame(
            [OrigenPagoEnum::PAGO_QR, OrigenPagoEnum::TRANSFERENCIA],
            OrigenPagoEnum::disponiblesPara([MetodoPagoEnum::YAPE]),
        );
        $this->assertTrue(OrigenPagoEnum::requiereNumeroOperacion([MetodoPagoEnum::YAPE]));
    }

    public function test_un_pago_mixto_toma_el_origen_de_la_parte_electronica(): void
    {
        $metodos = [MetodoPagoEnum::EFECTIVO, MetodoPagoEnum::YAPE];

        $this->assertNotContains(OrigenPagoEnum::VENTANILLA, OrigenPagoEnum::disponiblesPara($metodos));
        $this->assertTrue(OrigenPagoEnum::requiereNumeroOperacion($metodos));
    }

    public function test_ignora_metodos_vacios_o_invalidos(): void
    {
        $this->assertSame([MetodoPagoEnum::PLIN], OrigenPagoEnum::metodosDesde(['', null, 'xyz', 'plin']));
    }
}
