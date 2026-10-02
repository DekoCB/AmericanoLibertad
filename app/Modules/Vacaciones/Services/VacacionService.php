<?php

declare(strict_types=1);

namespace App\Modules\Vacaciones\Services;

use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Vacaciones\Models\Vacacion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class VacacionService
{
    /**
     * El periodo SIAGIE anual -- la única modalidad a la que aplicaban
     * las vacaciones -- se retiró (el instituto nunca llegó a usarlo en
     * producción, ver TipoPeriodoEnum). Sin esa modalidad no hay ninguna
     * matrícula a la que activarle vacaciones; el módulo queda sin
     * manera de usarse (oculto del menú) hasta que se decida una regla
     * de negocio que lo reemplace.
     */
    public function activar(Estudiante $estudiante, string $fechaInicio, ?int $registradoPor): Vacacion
    {
        throw ValidationException::withMessages([
            'estudiante' => 'Las vacaciones solo aplicaban a estudiantes matriculados en SIAGIE anual, una modalidad que ya no está disponible.',
        ]);
    }

    /**
     * @return Collection<int, Vacacion>
     */
    public function vigentes(): Collection
    {
        $hoy = Carbon::today();

        return Vacacion::query()
            ->where('fecha_inicio', '<=', $hoy)
            ->where('fecha_fin', '>=', $hoy)
            ->with(['estudiante', 'matricula.carrera'])
            ->orderBy('fecha_fin')
            ->get();
    }

    /**
     * @return Collection<int, Vacacion>
     */
    public function historial(): Collection
    {
        return Vacacion::query()
            ->where('fecha_fin', '<', Carbon::today())
            ->with(['estudiante', 'matricula.carrera'])
            ->latest('fecha_fin')
            ->get();
    }
}
