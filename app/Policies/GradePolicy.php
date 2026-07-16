<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Grade;
use App\Models\User;

class GradePolicy
{
    public function view(User $user, Grade $grade): bool
    {
        if ($user->hasRole(UserRole::Estudiante)) {
            return $user->student_id !== null && $user->student_id === $grade->student_id;
        }

        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $grade->evaluation->course->teacher_id;
        }

        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
        );
    }

    public function update(User $user, Grade $grade): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $grade->evaluation->course->teacher_id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }
}
