<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
            UserRole::Docente,
        );
    }

    public function view(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }

    public function update(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $this->create($user);
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->hasRole(UserRole::Gerencia);
    }
}
