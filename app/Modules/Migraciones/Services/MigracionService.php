<?php

declare(strict_types=1);

namespace App\Modules\Migraciones\Services;

use App\Models\Carrera;
use App\Modules\Academico\Models\Ciclo;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Services\CicloService;
use App\Modules\Academico\Services\PeriodoService;
use App\Modules\Evaluaciones\Enums\NotaLetraEnum;
use App\Modules\Evaluaciones\Services\EvaluacionService;
use App\Modules\Matricula\DTOs\RegistrarMatriculaData;
use App\Modules\Matricula\Enums\EstadoMatriculaEnum;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Matricula\Services\MatriculaService;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
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
        private readonly EvaluacionService $evaluaciones,
    ) {}

    /**
     * Cohorte de origen: matrículas vigentes (aprobadas) que coinciden con
     * los filtros elegidos (Periodo, Carrera, Ciclo curricular). Todos los
     * filtros son opcionales.
     *
     * @return Collection<int, Matricula>
     */
    public function matriculasVigentes(?int $cicloId, ?int $carreraId, ?int $cicloCurricular): Collection
    {
        return Matricula::query()
            ->where('estado', EstadoMatriculaEnum::APROBADA)
            ->when($cicloId !== null, fn ($q) => $q->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($q) => $q->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($q) => $q->where('ciclo_curricular', $cicloCurricular))
            ->with(['estudiante', 'carrera', 'ciclo'])
            ->get();
    }

    public function migrar(Matricula $origen, int $cicloDestinoId, int $cicloCurricularDestino, ?int $registradoPor): Matricula
    {
        $destino = $this->matriculas->matricular($origen->estudiante, new RegistrarMatriculaData(
            cicloId: $cicloDestinoId,
            carreraId: $origen->carrera_id,
            cicloCurricular: $cicloCurricularDestino,
            observaciones: null,
            registradoPor: $registradoPor,
        ));

        $this->arrastrarCursosDesaprobados($origen, $destino);

        return $destino;
    }

    /**
     * Vista previa de qué pasaría si se migra esta matrícula ahora mismo,
     * sin crear ni modificar nada -- misma lógica de decisión que
     * arrastrarCursosDesaprobados(), para que el coordinador vea antes de
     * confirmar cuántos cursos tiene el estudiante, cuántos ya aprobó y
     * cuáles se repetirían.
     *
     * @return array{total: int, aprobados: int, porRepetir: list<string>}
     */
    public function previsualizarCursos(Matricula $origen): array
    {
        $aprobados = 0;
        $porRepetir = [];

        foreach ($origen->todosLosHorarios() as $horario) {
            $letra = $this->evaluaciones->notaLetraDelEstudiante($origen->estudiante, $horario);

            if ($letra === NotaLetraEnum::C) {
                $porRepetir[] = "{$horario->curso->nombre} (ciclo {$horario->curso->cicloRomano()})";
            } elseif ($letra !== null) {
                $aprobados++;
            }
        }

        $pendientes = $origen->refuerzos()->where('estado', EstadoRefuerzoEnum::PENDIENTE)->with('curso')->get();

        foreach ($pendientes as $pendiente) {
            $porRepetir[] = "{$pendiente->curso->nombre} (ciclo {$pendiente->curso->cicloRomano()})";
        }

        return [
            'total' => $origen->todosLosHorarios()->count() + $pendientes->count(),
            'aprobados' => $aprobados,
            'porRepetir' => $porRepetir,
        ];
    }

    /**
     * El corazón de "repetir solo el curso jalado, no todo el ciclo": por
     * cada curso que tenía el estudiante en la matrícula de origen (cohorte
     * normal + cualquier refuerzo que ya venía arrastrando), se decide su
     * nota final con EvaluacionService::notaLetraDelEstudiante() y:
     *  - Desaprobado (letra C) -> se crea un MatriculaRefuerzo en destino.
     *  - Aprobado (AD/A/B) -> si era un refuerzo, se marca APROBADO y deja
     *    de arrastrarse.
     *  - Sin calificar (null) -> si era un refuerzo, se arrastra tal cual
     *    (todavía no hay con qué decidir); si era un curso normal, no pasa
     *    nada -- ese ciclo ni siquiera terminó de evaluarse.
     * Los refuerzos que nunca llegaron a tener sección asignada (nadie pudo
     * evaluarlos) se arrastran aparte, al final.
     */
    private function arrastrarCursosDesaprobados(Matricula $origen, Matricula $destino): void
    {
        foreach ($origen->todosLosHorarios() as $horario) {
            $refuerzoOrigen = $origen->refuerzos()->where('horario_id', $horario->id)->first();
            $letra = $this->evaluaciones->notaLetraDelEstudiante($origen->estudiante, $horario);

            if ($letra === null) {
                if ($refuerzoOrigen) {
                    $this->crearRefuerzo($destino, $refuerzoOrigen->curso_id, $origen);
                }

                continue;
            }

            if ($letra === NotaLetraEnum::C) {
                $refuerzoOrigen?->update(['estado' => EstadoRefuerzoEnum::DESAPROBADO]);
                $this->crearRefuerzo($destino, $horario->curso_id, $origen);

                continue;
            }

            $refuerzoOrigen?->update(['estado' => EstadoRefuerzoEnum::APROBADO]);
        }

        foreach ($origen->refuerzos()->where('estado', EstadoRefuerzoEnum::PENDIENTE)->get() as $pendiente) {
            $this->crearRefuerzo($destino, $pendiente->curso_id, $origen);
        }
    }

    /**
     * Crea el refuerzo en la matrícula destino, auto-asignando sección si
     * existe exactamente una para ese curso en el ciclo destino -- mismo
     * criterio que ya usa MatriculaService::asignarHorarioDeCurso() cuando
     * un curso no tiene paralelos.
     */
    private function crearRefuerzo(Matricula $destino, int $cursoId, Matricula $origen): void
    {
        $seccionesDisponibles = Horario::query()
            ->where('curso_id', $cursoId)
            ->where('ciclo_id', $destino->ciclo_id)
            ->get();

        $seccionUnica = $seccionesDisponibles->count() === 1 ? $seccionesDisponibles->first() : null;

        $destino->refuerzos()->create([
            'curso_id' => $cursoId,
            'horario_id' => $seccionUnica?->id,
            'estado' => $seccionUnica ? EstadoRefuerzoEnum::CURSANDO : EstadoRefuerzoEnum::PENDIENTE,
            'matricula_origen_id' => $origen->id,
        ]);
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

    /**
     * Un Ciclo nacido de un Periodo (ver PeriodoService) no tiene el `tipo`
     * rotativo que usa CicloService::siguienteCiclo() para rotar -- su
     * "siguiente" se resuelve vía el Periodo mismo
     * (PeriodoService::periodoSiguiente()). Los Ciclos rotativos heredados
     * (sin Periodo detrás) siguen resolviéndose como antes.
     */
    public function cicloDestinoSugerido(Ciclo $origen, CicloService $ciclos, PeriodoService $periodos): ?Ciclo
    {
        if ($origen->periodo !== null) {
            return $periodos->periodoSiguiente($origen->periodo)?->ciclo;
        }

        return $ciclos->siguienteCiclo($origen);
    }
}
