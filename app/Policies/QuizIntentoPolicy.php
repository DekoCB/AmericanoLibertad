<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\User;

class QuizIntentoPolicy
{
    public function resolver(User $user, Evaluation $evaluation): bool
    {
        if (! $user->hasRole(UserRole::Estudiante) || $user->student_id === null) {
            return false;
        }

        if ($evaluation->type !== 'quiz') {
            return false;
        }

        return $evaluation->course
            ->enrollments()
            ->where('student_id', $user->student_id)
            ->where('status', 'active')
            ->exists();
    }
}
