<?php

declare(strict_types=1);

namespace App\Modules\Migraciones\Services;

use App\Models\Carrera;
use App\Modules\Academico\Enums\ModalidadCicloEnum;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Services\CicloService;
use App\Modules\Matricula\DTOs\RegistrarMatriculaData;
use App\Modules\Matricula\Enums\EstadoMatriculaEnum;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Matricula\Services\MatriculaService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * "Avanzar de ciclo" no es más que una rematrícula (ver
 * MatriculaService::matricular()) en un ciclo/carrera destino elegidos a
 * mano -- lo mismo que ya hacía el wizard para una rematrícula individual,
 * pero como herramienta dedicada y con soporte para aplicarlo a varios
 * estudiantes a la vez (ver migrarMasivo(), mismo patrón tolerante a
 * errores por fila que MatriculaService::matricularDesdeFilas()). La
 * carrera nunca cambia en una migración -- solo el ciclo_curricular (I-VI)
 * dentro de esa misma carrera.
 */
class MigracionService
{
    public function __construct(
        private readonly MatriculaService $matriculas,
        private readonly CicloService $ciclos,
    ) {}

    /**
     * Cohorte de origen: matrículas vigentes (aprobadas) que coinciden con
     * los filtros elegidos. El primer filtro es siempre la modalidad del
     * ciclo (Grupo rotativo de 6 meses vs. SIAGIE anual) -- ver el
     * comentario de la vista sobre por qué SIAGIE anual no tiene un filtro
     * de "Grupo" propio, a diferencia de 6 meses. Todos los filtros salvo
     * $modalidad son opcionales.
     *
     * @return Collection<int, Matricula>
     */
    public function matriculasVigentes(?ModalidadCicloEnum $modalidad, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular): Collection
    {
        return Matricula::query()
            ->where('estado', EstadoMatriculaEnum::APROBADA)
            ->when($modalidad !== null, fn ($q) => $q->whereHas('ciclo', fn ($qq) => $qq->where('modalidad', $modalidad)))
            ->when($cicloId !== null, fn ($q) => $q->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($q) => $q->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($q) => $q->where('ciclo_curricular', $cicloCurricular))
            ->with(['estudiante', 'carrera', 'ciclo'])
            ->get();
    }

    /**
     * Sirve tanto para acotar la cohorte de origen en modo masivo como
     * para sugerir destino, sin pedirle al usuario que elija un "Grupo"
     * que no existe en la modalidad anual (ver CicloService::cicloAnualVigente()).
     */
    public function cicloAnualVigente(): ?Ciclo
    {
        return $this->ciclos->cicloAnualVigente();
    }

    public function migrar(Matricula $origen, int $cicloDestinoId, int $cicloCurricularDestino, ?int $registradoPor): Matricula
    {
        return $this->matriculas->matricular($origen->estudiante, new RegistrarMatriculaData(
            cicloId: $cicloDestinoId,
            carreraId: $origen->carrera_id,
            cicloCurricular: $cicloCurricularDestino,
            observaciones: null,
            registradoPor: $registradoPor,
        ));
    }

    /**
     * @param  Collection<int, Matricula>  $origenes
     * @return array{exitosos: int, errores: list<array{estudiante: string, mensaje: string}>}
     */
    public function migrarMasivo(Collection $origenes, int $cicloDestinoId, int $cicloCurricularDestino, ?int $registradoPor): array
    {
        $exitosos = 0;
        $errores = [];

        foreach ($origenes as $origen) {
            try {
                $this->migrar($origen, $cicloDestinoId, $cicloCurricularDestino, $registradoPor);
                $exitosos++;
            } catch (Throwable $e) {
                $errores[] = [
                    'estudiante' => $origen->estudiante->nombreCompleto(),
                    'mensaje' => $e instanceof ValidationException ? $e->validator->errors()->first() : $e->getMessage(),
                ];
            }
        }

        return ['exitosos' => $exitosos, 'errores' => $errores];
    }

    /**
     * El siguiente ciclo curricular DENTRO DE LA MISMA CARRERA -- a
     * diferencia del viejo Grado::orden (una secuencia única para todo el
     * colegio), el ciclo I-VI está acotado por carrera: el ciclo 3 de
     * Enfermería no tiene relación con el ciclo 3 de Farmacia, y no hay
     * "siguiente" más allá de Carrera::total_ciclos.
     */
    public function cicloCurricularSiguiente(Carrera $carrera, int $cicloActual): ?int
    {
        return $cicloActual < $carrera->total_ciclos ? $cicloActual + 1 : null;
    }

    public function cicloDestinoSugerido(Ciclo $origen, CicloService $ciclos): ?Ciclo
    {
        if ($origen->modalidad === ModalidadCicloEnum::ANUAL) {
            return Ciclo::query()
                ->where('modalidad', ModalidadCicloEnum::ANUAL)
                ->where('anio', $origen->anio + 1)
                ->first();
        }

        return $ciclos->siguienteCiclo($origen);
    }
}
