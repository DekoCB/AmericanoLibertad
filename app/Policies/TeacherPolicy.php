<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Teacher;
use App\Models\User;

class TeacherPolicy
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

    public function view(User $user, Teacher $teacher): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $this->create($user);
    }
}
