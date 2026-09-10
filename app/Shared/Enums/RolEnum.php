<?php

declare(strict_types=1);

namespace App\Shared\Enums;

enum RolEnum: string
{
    case GERENCIA = 'gerencia';
    case COORDINADOR = 'coordinador';
    case ADMINISTRATIVO = 'administrativo';
    case ACADEMICO = 'academico';
    case DOCENTE = 'docente';
    case ESTUDIANTE = 'estudiante';

    public function label(): string
    {
        return match ($this) {
            self::GERENCIA => 'Gerencia',
            self::COORDINADOR => 'Coordinador',
            self::ADMINISTRATIVO => 'Secretaría',
            self::ACADEMICO => 'Académico',
            self::DOCENTE => 'Docente',
            self::ESTUDIANTE => 'Estudiante',
        };
    }
}
