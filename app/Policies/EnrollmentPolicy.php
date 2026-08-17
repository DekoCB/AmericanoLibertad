<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function create(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $this->isStaffManager($user);
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $enrollment->course->teacher_id;
        }

        return $this->isStaffManager($user);
    }

    private function isStaffManager(User $user): bool
    {
        return $user->hasRole(
            UserRole::Gerencia,
            UserRole::Administrativo,
            UserRole::Coordinador,
            UserRole::Academico,
        );
    }
}
