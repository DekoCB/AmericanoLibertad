<?php

namespace App\Support;

class NumeroALetras
{
    private const UNIDADES = [
        1 => 'UNO', 2 => 'DOS', 3 => 'TRES', 4 => 'CUATRO', 5 => 'CINCO',
        6 => 'SEIS', 7 => 'SIETE', 8 => 'OCHO', 9 => 'NUEVE',
    ];

    private const DIEZ_A_DIECINUEVE = [
        10 => 'DIEZ', 11 => 'ONCE', 12 => 'DOCE', 13 => 'TRECE', 14 => 'CATORCE',
        15 => 'QUINCE', 16 => 'DIECISÉIS', 17 => 'DIECISIETE', 18 => 'DIECIOCHO', 19 => 'DIECINUEVE',
    ];

    private const VEINTI = [
        20 => 'VEINTE', 21 => 'VEINTIUNO', 22 => 'VEINTIDÓS', 23 => 'VEINTITRÉS', 24 => 'VEINTICUATRO',
        25 => 'VEINTICINCO', 26 => 'VEINTISÉIS', 27 => 'VEINTISIETE', 28 => 'VEINTIOCHO', 29 => 'VEINTINUEVE',
    ];

    private const DECENAS = [
        3 => 'TREINTA', 4 => 'CUARENTA', 5 => 'CINCUENTA', 6 => 'SESENTA',
        7 => 'SETENTA', 8 => 'OCHENTA', 9 => 'NOVENTA',
    ];

    private const CENTENAS = [
        1 => 'CIENTO', 2 => 'DOSCIENTOS', 3 => 'TRESCIENTOS', 4 => 'CUATROCIENTOS', 5 => 'QUINIENTOS',
        6 => 'SEISCIENTOS', 7 => 'SETECIENTOS', 8 => 'OCHOCIENTOS', 9 => 'NOVECIENTOS',
    ];

    public static function convertir(float $monto, string $moneda = 'SOLES'): string
    {
        $entero = (int) floor($monto);
        $centavos = (int) round(($monto - $entero) * 100);

        return sprintf('%s CON %02d/100 %s', self::convertirEntero($entero), $centavos, $moneda);
    }

    private static function convertirEntero(int $numero): string
    {
        if ($numero === 0) {
            return 'CERO';
        }

        if ($numero >= 1000000) {
            $millones = intdiv($numero, 1000000);
            $resto = $numero % 1000000;
            $prefijo = $millones === 1 ? 'UN MILLÓN' : self::convertirEntero($millones) . ' MILLONES';

            return trim($prefijo . ($resto > 0 ? ' ' . self::convertirEntero($resto) : ''));
        }

        if ($numero >= 1000) {
            $miles = intdiv($numero, 1000);
            $resto = $numero % 1000;
            $prefijo = $miles === 1 ? 'MIL' : self::convertirEntero($miles) . ' MIL';

            return trim($prefijo . ($resto > 0 ? ' ' . self::convertirEntero($resto) : ''));
        }

        if ($numero === 100) {
            return 'CIEN';
        }

        if ($numero >= 100) {
            $centena = intdiv($numero, 100);
            $resto = $numero % 100;

            return trim(self::CENTENAS[$centena] . ($resto > 0 ? ' ' . self::convertirEntero($resto) : ''));
        }

        if ($numero >= 30) {
            $decena = intdiv($numero, 10);
            $unidad = $numero % 10;

            return $unidad > 0 ? self::DECENAS[$decena] . ' Y ' . self::UNIDADES[$unidad] : self::DECENAS[$decena];
        }

        if ($numero >= 20) {
            return self::VEINTI[$numero];
        }

        if ($numero >= 10) {
            return self::DIEZ_A_DIECINUEVE[$numero];
        }

        return self::UNIDADES[$numero];
    }
}
