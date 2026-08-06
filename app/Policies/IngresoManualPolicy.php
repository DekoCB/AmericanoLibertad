<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\IngresoManual;
use App\Models\User;

class IngresoManualPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function view(User $user, IngresoManual $ingresoManual): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, IngresoManual $ingresoManual): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, IngresoManual $ingresoManual): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
