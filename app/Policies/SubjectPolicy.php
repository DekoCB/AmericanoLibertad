<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Subject;
use App\Models\User;

class SubjectPolicy
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

    public function view(User $user, Subject $subject): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }

    public function update(User $user, Subject $subject): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Subject $subject): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }

    public function manageImagen(User $user): bool
    {
        return $user->hasRole(UserRole::Coordinador, UserRole::Gerencia);
    }
}
