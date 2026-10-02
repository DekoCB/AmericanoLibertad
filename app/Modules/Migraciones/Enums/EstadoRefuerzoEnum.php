<?php

declare(strict_types=1);

namespace App\Modules\Migraciones\Enums;

enum EstadoRefuerzoEnum: string
{
    case PENDIENTE = 'pendiente';
    case CURSANDO = 'cursando';
    case APROBADO = 'aprobado';
    case DESAPROBADO = 'desaprobado';

    public function label(): string
    {
        return match ($this) {
            self::PENDIENTE => 'Pendiente de asignar sección',
            self::CURSANDO => 'Cursando',
            self::APROBADO => 'Aprobado',
            self::DESAPROBADO => 'Desaprobado',
        };
    }
}
