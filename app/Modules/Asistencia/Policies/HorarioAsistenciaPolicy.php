<?php

declare(strict_types=1);

namespace App\Modules\Asistencia\Policies;

use App\Models\User;
use App\Modules\Academico\Models\Horario;
use App\Modules\Matricula\Models\Matricula;

/**
 * Autorización sobre "¿puede este usuario ver/registrar la asistencia de
 * este horario?". No se registra vía Gate::policy() porque Horario
 * pertenece al módulo Académico y ya podría tener su propia policy de
 * edición allí; en su lugar se enlaza a habilidades con nombre propio
 * desde AsistenciaServiceProvider.
 */
class HorarioAsistenciaPolicy
{
    public function registrar(User $user, Horario $horario): bool
    {
        if ($user->hasRole('gerencia')) {
            return true;
        }

        return $user->hasPermissionTo('asistencia.registrar') && $horario->docente_id === $user->id;
    }

    public function ver(User $user, Horario $horario): bool
    {
        if ($user->hasPermissionTo('asistencia.ver')) {
            return true;
        }

        if ($this->registrar($user, $horario)) {
            return true;
        }

        return $this->estudianteMatriculado($user, $horario);
    }

    /**
     * Cuenta como matriculado el estudiante con una matrícula aprobada en
     * la misma carrera, ciclo curricular y ciclo del horario (ver
     * Matricula::scopeDelHorario()), o que esté repitiendo este horario
     * como curso en recuperación (MatriculaRefuerzo) -- sin esto, un
     * estudiante con un curso jalado quedaría sin poder ver su propia
     * asistencia en ese horario, aunque sí pueda ver sus evaluaciones y el
     * aula virtual de ese mismo curso (ver EvaluacionService y
     * CursoVirtualService, que sí contemplan el refuerzo).
     */
    private function estudianteMatriculado(User $user, Horario $horario): bool
    {
        if (! $user->hasPermissionTo('asistencia.ver_propio')) {
            return false;
        }

        $estudiante = $user->estudiante;

        if (! $estudiante) {
            return false;
        }

        if (Matricula::query()->where('estudiante_id', $estudiante->id)->delHorario($horario)->exists()) {
            return true;
        }

        return Matricula::query()
            ->where('estudiante_id', $estudiante->id)
            ->whereHas('refuerzos', fn ($query) => $query->where('horario_id', $horario->id))
            ->exists();
    }
}
