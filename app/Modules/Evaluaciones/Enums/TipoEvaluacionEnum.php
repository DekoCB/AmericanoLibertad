<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Enums;

/**
 * Cada mitad de ciclo tiene exactamente 1 Examen (parcial o final, según la
 * mitad) más cualquier cantidad de evaluaciones Continuas que el docente
 * decida crear (antes eran exactamente 4 -- C1 a C4 -- pero algunos
 * docentes necesitan más u otras menos, así que ahora son abiertas: cuentan
 * todas por igual dentro del 60% que les corresponde, ver
 * EvaluacionService::promedioMitad()).
 */
enum TipoEvaluacionEnum: string
{
    case CONTINUA = 'continua';
    case EXAMEN = 'examen';
}
