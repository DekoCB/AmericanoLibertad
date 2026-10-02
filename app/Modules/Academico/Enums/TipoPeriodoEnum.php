<?php

declare(strict_types=1);

namespace App\Modules\Academico\Enums;

/**
 * Los 2 periodos de matrícula del año: cada uno tiene siempre un Ciclo
 * real detrás con sus propios Horarios (ver Periodo::$ciclo) -- el tipo
 * ANUAL que existía antes se retiró (el instituto nunca llegó a usarlo en
 * producción); de aquí en adelante todo periodo dura 6 meses de clases.
 */
enum TipoPeriodoEnum: string
{
    case PRIMERO = 'primero';
    case SEGUNDO = 'segundo';

    public function label(): string
    {
        return match ($this) {
            self::PRIMERO => '1.er periodo',
            self::SEGUNDO => '2.° periodo',
        };
    }
}
