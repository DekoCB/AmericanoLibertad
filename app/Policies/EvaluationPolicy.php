<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Evaluation;
use App\Models\User;

class EvaluationPolicy
{
    public function create(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $user->hasRole(UserRole::Coordinador, UserRole::Academico);
    }

    public function update(User $user, Evaluation $evaluation): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $evaluation->course->teacher_id;
        }

        return $user->hasRole(UserRole::Coordinador, UserRole::Academico);
    }

    public function delete(User $user, Evaluation $evaluation): bool
    {
        return $this->update($user, $evaluation);
    }

    public function grade(User $user, Evaluation $evaluation): bool
    {
        return $this->gradeAny($user, $evaluation->course);
    }

    public function gradeAny(User $user, Course $course): bool
    {
        if ($user->hasRole(UserRole::Docente)) {
            return $user->teacher_id !== null && $user->teacher_id === $course->teacher_id;
        }

        return $user->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico);
    }
}
