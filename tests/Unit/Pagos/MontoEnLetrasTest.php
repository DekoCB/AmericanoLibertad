<?php

namespace Tests\Unit\Pagos;

use App\Modules\Pagos\Support\MontoEnLetras;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class MontoEnLetrasTest extends TestCase
{
    /**
     * @return array<string, array{float, string}>
     */
    public static function montos(): array
    {
        return [
            'cero' => [0, 'CERO CON 00/100 SOLES'],
            'cien exacto' => [100, 'CIEN CON 00/100 SOLES'],
            'ciento uno' => [101, 'CIENTO UNO CON 00/100 SOLES'],
            'pensión típica' => [230, 'DOSCIENTOS TREINTA CON 00/100 SOLES'],
            'con céntimos' => [999.99, 'NOVECIENTOS NOVENTA Y NUEVE CON 99/100 SOLES'],
            'mil' => [1000, 'MIL CON 00/100 SOLES'],
            'veintiún mil' => [21000, 'VEINTIÚN MIL CON 00/100 SOLES'],
            'treinta y un mil' => [31500, 'TREINTA Y UN MIL QUINIENTOS CON 00/100 SOLES'],
            'un millón' => [1_000_000, 'UN MILLÓN CON 00/100 SOLES'],
        ];
    }

    #[DataProvider('montos')]
    public function test_convierte_el_monto_a_letras(float $monto, string $esperado): void
    {
        $this->assertSame($esperado, MontoEnLetras::soles($monto));
    }
}
