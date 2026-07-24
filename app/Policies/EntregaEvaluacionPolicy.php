<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\User;

class EntregaEvaluacionPolicy
{
    public function subir(User $user, Evaluation $evaluation): bool
    {
        if (! $user->hasRole(UserRole::Estudiante) || $user->student_id === null) {
            return false;
        }

        if (! in_array($evaluation->type, ['homework', 'project'], true)) {
            return false;
        }

        return $evaluation->course
            ->enrollments()
            ->where('student_id', $user->student_id)
            ->where('status', 'active')
            ->exists();
    }
}
