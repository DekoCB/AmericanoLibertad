<?php

declare(strict_types=1);

namespace App\Modules\AulaVirtual\Repositories\Eloquent;

use App\Modules\AulaVirtual\Models\CursoVirtual;
use App\Modules\AulaVirtual\Repositories\Contracts\CursoVirtualRepositoryInterface;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Shared\Repositories\BaseRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * @extends BaseRepository<CursoVirtual>
 */
class EloquentCursoVirtualRepository extends BaseRepository implements CursoVirtualRepositoryInterface
{
    /**
     * @return Builder<CursoVirtual>
     */
    protected function query(): Builder
    {
        return CursoVirtual::query()->with(['horario.curso', 'horario.carrera', 'horario.ciclo', 'horario.docente', 'horario.dias']);
    }

    public function delDocente(int $docenteId): Collection
    {
        return $this->query()
            ->whereHas('horario', fn ($query) => $query->where('docente_id', $docenteId))
            ->get();
    }

    /**
     * Incluye los cursos virtuales de cualquier curso en recuperación que
     * el estudiante tenga asignado (ver Matricula::todosLosHorarios()),
     * además de los de su cohorte normal.
     */
    public function delEstudiante(Estudiante $estudiante): Collection
    {
        $matriculas = $estudiante->matriculas()->where('estado', 'aprobada')->get();

        if ($matriculas->isEmpty()) {
            return new Collection;
        }

        $horarioIds = $matriculas
            ->flatMap(fn (Matricula $matricula) => $matricula->todosLosHorarios())
            ->pluck('id')
            ->unique();

        return $this->query()
            ->where('activo', true)
            ->whereIn('horario_id', $horarioIds)
            ->get();
    }

    public function paraHorario(int $horarioId): ?CursoVirtual
    {
        return $this->query()->where('horario_id', $horarioId)->first();
    }
}
