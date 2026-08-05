<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AdmissionApplication;
use App\Models\User;

class AdmissionApplicationPolicy
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

    public function view(User $user, AdmissionApplication $admissionApplication): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, AdmissionApplication $admissionApplication): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, AdmissionApplication $admissionApplication): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
