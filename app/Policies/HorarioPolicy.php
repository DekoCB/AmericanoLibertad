<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class HorarioPolicy
{
    public function viewOwn(User $user): bool
    {
        return $user->hasRole(UserRole::Estudiante) && $user->student_id !== null;
    }

    public function manage(User $user): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }
}
