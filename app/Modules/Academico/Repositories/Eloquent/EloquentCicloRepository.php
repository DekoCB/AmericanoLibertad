<?php

declare(strict_types=1);

namespace App\Modules\Academico\Repositories\Eloquent;

use App\Modules\Academico\Enums\ModalidadCicloEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Repositories\Contracts\CicloRepositoryInterface;
use App\Shared\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * @extends BaseRepository<Ciclo>
 */
class EloquentCicloRepository extends BaseRepository implements CicloRepositoryInterface
{
    protected function query(): Builder
    {
        return Ciclo::query();
    }

    public function solapadosCon(string $fechaInicio, string $fechaFin, ?int $exceptoId = null): Collection
    {
        return Ciclo::query()
            ->where('fecha_inicio', '<=', $fechaFin)
            ->where('fecha_fin', '>=', $fechaInicio)
            ->when($exceptoId, fn ($query) => $query->whereKeyNot($exceptoId))
            ->get();
    }

    /**
     * "Activo" = el Ciclo cuyo rango de fechas incluye hoy, no el que tenga
     * `estado = ACTIVO`: tras la migración a Periodo, ningún flujo de
     * producción (CicloService::crear(), los formularios de
     * Ciclos/Periodos) escribe ese estado -- solo lo hacen el seeder de
     * demo y las factories de test. Filtrar por `estado` dejaba este
     * método devolviendo siempre null en producción, y con eso
     * BloqueoAccesoService::tieneCuotasVencidasEnCicloActual() nunca
     * bloqueaba nada. solapadosCon() ya impide crear dos Ciclos con rangos
     * de fecha superpuestos, así que el rango incluye hoy en, a lo sumo,
     * un único Ciclo.
     */
    public function activo(): ?Ciclo
    {
        return Ciclo::query()
            ->where('fecha_inicio', '<=', now()->toDateString())
            ->where('fecha_fin', '>=', now()->toDateString())
            ->first();
    }

    public function paginateCiclos(int $perPage = 15): LengthAwarePaginator
    {
        return Ciclo::query()->where('modalidad', ModalidadCicloEnum::SEIS_MESES)->paginate($perPage);
    }
}
