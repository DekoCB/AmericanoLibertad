<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Enums;

/**
 * Las dos mitades internas de 3 meses en las que se divide cada Ciclo (de 6
 * meses) para la calificación -- independiente del Periodo Primero/Segundo
 * que ya existe en Académico, que es un concepto de 6 meses usado solo para
 * el rótulo del "periodo promocional" de la libreta.
 */
enum MitadCicloEnum: string
{
    case PRIMERA = 'primera';
    case SEGUNDA = 'segunda';

    public function label(): string
    {
        return match ($this) {
            self::PRIMERA => 'I',
            self::SEGUNDA => 'II',
        };
    }

    public function examenLabel(): string
    {
        return match ($this) {
            self::PRIMERA => 'Examen parcial',
            self::SEGUNDA => 'Examen final',
        };
    }
}
