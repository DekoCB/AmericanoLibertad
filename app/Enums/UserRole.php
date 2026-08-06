<?php

namespace App\Enums;

enum UserRole: string
{
    case Gerencia = 'gerencia';
    case Administrativo = 'administrativo';
    case Coordinador = 'coordinador';
    case Academico = 'academico';
    case Docente = 'docente';
    case Estudiante = 'estudiante';

    public function label(): string
    {
        return match ($this) {
            self::Gerencia => 'Gerencia',
            self::Administrativo => 'Secretaría',
            self::Coordinador => 'Coordinador',
            self::Academico => 'Académico',
            self::Docente => 'Docente',
            self::Estudiante => 'Estudiante',
        };
    }

    /**
     * Roles that manage the academic structure (courses, evaluations, grades)
     * but cannot delete master records (students, teachers, subjects).
     */
    public function isAcademicManager(): bool
    {
        return in_array($this, [self::Coordinador, self::Academico], true);
    }

    /**
     * Roles with administrative access to students/teachers/enrollments.
     */
    public function isAdministrative(): bool
    {
        return in_array($this, [self::Gerencia, self::Administrativo], true);
    }

    public function isStaff(): bool
    {
        return $this !== self::Estudiante && $this !== self::Docente;
    }

    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}
