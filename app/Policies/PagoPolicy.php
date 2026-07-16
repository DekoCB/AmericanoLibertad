<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Pago;
use App\Models\User;

class PagoPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function view(User $user, Pago $pago): bool
    {
        if ($user->hasRole(UserRole::Estudiante)) {
            return $user->student_id !== null && $user->student_id === $pago->student_id;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function delete(User $user, Pago $pago): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
