<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PermisoDocente;
use App\Models\Teacher;
use App\Models\User;

class PermisoDocentePolicy
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

    public function update(User $user, PermisoDocente $permisoDocente): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo, UserRole::Coordinador);
    }

    public function delete(User $user, PermisoDocente $permisoDocente): bool
    {
        if ($permisoDocente->estado !== 'pendiente') {
            return $user->hasRole(UserRole::Gerencia);
        }

        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $permisoDocente->teacher_id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Administrativo);
    }
}
