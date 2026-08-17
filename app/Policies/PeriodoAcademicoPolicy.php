<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PeriodoAcademico;
use App\Models\User;

class PeriodoAcademicoPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function view(User $user, PeriodoAcademico $periodoAcademico): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, PeriodoAcademico $periodoAcademico): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, PeriodoAcademico $periodoAcademico): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
