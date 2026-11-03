<?php

declare(strict_types=1);

namespace App\Modules\Matricula\Repositories\Eloquent;

use App\Modules\Matricula\Enums\EstadoMatriculaEnum;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Matricula\Repositories\Contracts\MatriculaRepositoryInterface;
use App\Shared\Repositories\BaseRepository;
use Illuminate\Database\Eloquent\Builder;

/**
 * @extends BaseRepository<Matricula>
 */
class EloquentMatriculaRepository extends BaseRepository implements MatriculaRepositoryInterface
{
    /**
     * @return Builder<Matricula>
     */
    protected function query(): Builder
    {
        return Matricula::query()->with(['estudiante', 'ciclo', 'carrera']);
    }

    public function existeParaEstudianteYCiclo(int $estudianteId, int $cicloId): bool
    {
        // Sin excluir ANULADA, anular una matrícula mal registrada deja al
        // estudiante sin forma de volver a matricularse en el mismo ciclo:
        // MatriculaService::matricular() usa este método para rechazar
        // duplicados, y una fila anulada no es una matrícula vigente.
        return Matricula::query()
            ->where('estudiante_id', $estudianteId)
            ->where('ciclo_id', $cicloId)
            ->where('estado', '!=', EstadoMatriculaEnum::ANULADA)
            ->exists();
    }
}
