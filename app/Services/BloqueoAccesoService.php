<?php

namespace App\Services;

use App\Models\BloqueoAcceso;
use App\Models\Cuota;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;

/**
 * Umbral institucional: 2 o más cuotas vencidas sin pagar bloquean el
 * acceso del estudiante hasta que se ponga al día.
 */
class BloqueoAccesoService
{
    private const CUOTAS_VENCIDAS_PARA_BLOQUEAR = 2;

    /**
     * @return Collection<int, Cuota>
     */
    public function cuotasVencidasDe(Student $student): Collection
    {
        return Cuota::query()
            ->where('estado', 'vencido')
            ->whereHas('matricula', fn ($q) => $q->where('student_id', $student->id))
            ->get();
    }

    public function estaBloqueado(Student $student): bool
    {
        return BloqueoAcceso::query()
            ->where('student_id', $student->id)
            ->where('activo', true)
            ->exists();
    }

    public function bloqueoActivoDe(Student $student): ?BloqueoAcceso
    {
        return BloqueoAcceso::query()
            ->where('student_id', $student->id)
            ->where('activo', true)
            ->latest('fecha_bloqueo')
            ->first();
    }

    /**
     * Recalcula si el estudiante debe estar bloqueado según sus cuotas
     * vencidas y crea o levanta el bloqueo según corresponda. Se llama tras
     * cada aprobación/rechazo de pago y tras crear/completar un plan de cuotas.
     */
    public function evaluarYDesbloquear(Student $student): void
    {
        $cuotasVencidas = $this->cuotasVencidasDe($student)->count();
        $bloqueoActivo = $this->bloqueoActivoDe($student);

        if ($cuotasVencidas >= self::CUOTAS_VENCIDAS_PARA_BLOQUEAR) {
            if (! $bloqueoActivo) {
                BloqueoAcceso::query()->create([
                    'student_id' => $student->id,
                    'motivo' => "{$cuotasVencidas} cuotas vencidas sin pagar",
                    'fecha_bloqueo' => now(),
                    'activo' => true,
                ]);
            }

            return;
        }

        if ($bloqueoActivo) {
            $bloqueoActivo->update([
                'fecha_desbloqueo' => now(),
                'activo' => false,
            ]);
        }
    }
}
