<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Egreso;
use App\Models\User;

class EgresoPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function view(User $user, Egreso $egreso): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Egreso $egreso): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, Egreso $egreso): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
