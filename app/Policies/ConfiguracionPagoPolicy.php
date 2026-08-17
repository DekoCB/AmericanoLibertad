<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class ConfiguracionPagoPolicy
{
    public function view(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function update(User $user): bool
    {
        return $this->view($user);
    }
}
