<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\User;

class RecursoAulaPolicy
{
    public function view(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        if ($user->hasRole(UserRole::Estudiante)) {
            return $user->student_id !== null
                && $course->enrollments()->where('student_id', $user->student_id)->exists();
        }

        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
        );
    }

    public function manage(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }
}
