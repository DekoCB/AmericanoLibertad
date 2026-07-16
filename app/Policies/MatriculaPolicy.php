<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Matricula;
use App\Models\User;

class MatriculaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
        );
    }

    public function view(User $user, Matricula $matricula): bool
    {
        if ($user->hasRole(UserRole::Estudiante)) {
            return $user->student_id !== null && $user->student_id === $matricula->student_id;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function update(User $user, Matricula $matricula): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Matricula $matricula): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
