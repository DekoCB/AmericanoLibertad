<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Carrera;
use App\Models\User;

class CarreraPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Carrera $carrera): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Academico);
    }

    public function update(User $user, Carrera $carrera): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Carrera $carrera): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
