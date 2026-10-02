<?php

declare(strict_types=1);

namespace App\Modules\Academico\Enums;

/**
 * La vía de estudio de un Ciclo. Hoy solo existe "seis_meses": tanto los
 * Ciclos rotativos heredados (Ciclo 1 a 4, ver TipoCicloEnum, con `tipo`
 * no nulo) como los que nacen de un Periodo (ver PeriodoService, con
 * `tipo` nulo) duran 6 meses de clases. La modalidad "anual" existió en
 * algún momento pero el instituto nunca llegó a usarla en producción -- se
 * retiró junto con TipoPeriodoEnum::ANUAL.
 */
enum ModalidadCicloEnum: string
{
    case SEIS_MESES = 'seis_meses';

    public function label(): string
    {
        return match ($this) {
            self::SEIS_MESES => 'Ciclo rotativo (6 meses)',
        };
    }
}
