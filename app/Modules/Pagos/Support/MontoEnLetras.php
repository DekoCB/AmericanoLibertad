<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Support;

/**
 * Convierte un monto a la leyenda "SON: ... CON xx/100 SOLES" de los
 * comprobantes peruanos. Implementación propia (no NumberFormatter) para no
 * depender de que la extensión intl esté habilitada en el servidor.
 */
final class MontoEnLetras
{
    private const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
        'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];

    private const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];

    private const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
        'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    public static function soles(float $monto): string
    {
        $centimos = (int) round($monto * 100);
        $entero = intdiv($centimos, 100);
        $decimales = $centimos % 100;

        return sprintf('%s CON %02d/100 SOLES', self::entero($entero), $decimales);
    }

    public static function entero(int $numero): string
    {
        if ($numero === 0) {
            return 'CERO';
        }

        $partes = [];

        $millones = intdiv($numero, 1_000_000);
        $miles = intdiv($numero % 1_000_000, 1000);
        $resto = $numero % 1000;

        if ($millones > 0) {
            $partes[] = $millones === 1 ? 'UN MILLÓN' : self::apocopar(self::centenas($millones)).' MILLONES';
        }

        if ($miles > 0) {
            $partes[] = $miles === 1 ? 'MIL' : self::apocopar(self::centenas($miles)).' MIL';
        }

        if ($resto > 0) {
            $partes[] = self::centenas($resto);
        }

        return implode(' ', $partes);
    }

    private static function centenas(int $numero): string
    {
        if ($numero === 100) {
            return 'CIEN';
        }

        $centena = intdiv($numero, 100);
        $resto = $numero % 100;

        $texto = self::CENTENAS[$centena];

        if ($resto > 0) {
            $texto = trim($texto.' '.self::decenas($resto));
        }

        return $texto;
    }

    private static function decenas(int $numero): string
    {
        if ($numero < 30) {
            return self::UNIDADES[$numero];
        }

        $decena = intdiv($numero, 10);
        $unidad = $numero % 10;

        return self::DECENAS[$decena].($unidad > 0 ? ' Y '.self::UNIDADES[$unidad] : '');
    }

    /**
     * "UNO" pasa a "UN" delante de MIL/MILLONES ("VEINTIÚN MIL", "TREINTA Y UN MIL").
     */
    private static function apocopar(string $texto): string
    {
        if (str_ends_with($texto, 'VEINTIUNO')) {
            return substr($texto, 0, -strlen('VEINTIUNO')).'VEINTIÚN';
        }

        if (str_ends_with($texto, 'UNO')) {
            return substr($texto, 0, -3).'UN';
        }

        return $texto;
    }
}
