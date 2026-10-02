<?php

declare(strict_types=1);

namespace App\Modules\Matricula\Enums;

enum ModalidadEstudioEnum: string
{
    case PRESENCIAL = 'presencial';
    case VIRTUAL = 'virtual';

    public function label(): string
    {
        return match ($this) {
            self::PRESENCIAL => 'Presencial',
            self::VIRTUAL => 'Virtual',
        };
    }
}
