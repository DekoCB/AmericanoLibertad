<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
        );
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $this->create($user);
    }
}
