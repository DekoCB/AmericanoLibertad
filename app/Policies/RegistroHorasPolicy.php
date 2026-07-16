<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\RegistroHoras;
use App\Models\Teacher;
use App\Models\User;

class RegistroHorasPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Docente,
        );
    }

    public function create(User $user, Teacher $teacher): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $teacher->id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo, UserRole::Coordinador);
    }

    public function delete(User $user, RegistroHoras $registroHoras): bool
    {
        if ($registroHoras->pagado) {
            return false;
        }

        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $registroHoras->teacher_id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }

    public function generarPago(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }
}
