<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Services;

use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\NotaLetraEnum;
use App\Modules\Evaluaciones\Models\Calificacion;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Notificaciones\Enums\TipoNotificacionEnum;
use App\Modules\Notificaciones\Services\NotificacionService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection as SupportCollection;
use InvalidArgumentException;
use Throwable;

class EvaluacionService
{
    public function __construct(
        private readonly NotificacionService $notificaciones,
    ) {}

    /**
     * Estudiantes matriculados (aprobados) en la carrera y ciclo de un
     * horario (ver Matricula::scopeDelHorario()), más cualquier estudiante
     * que tenga este horario asignado como curso en recuperación -- sin
     * esto, un estudiante repitiendo un curso de un ciclo_curricular menor
     * no aparecería en la lista del docente para calificar/pasar asistencia.
     *
     * @return Collection<int, Estudiante>
     */
    public function estudiantesDelHorario(Horario $horario): Collection
    {
        $porMatricula = Matricula::query()->delHorario($horario)->pluck('estudiante_id');

        $porRefuerzo = Matricula::query()
            ->whereHas('refuerzos', fn ($query) => $query->where('horario_id', $horario->id))
            ->pluck('estudiante_id');

        return Estudiante::query()
            ->whereIn('id', $porMatricula->merge($porRefuerzo)->unique())
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();
    }

    /**
     * @return Collection<int, Horario>
     */
    public function horariosDelDocente(int $docenteId): Collection
    {
        return Horario::query()
            ->where('docente_id', $docenteId)
            ->with(['curso', 'carrera', 'ciclo', 'dias'])
            ->get();
    }

    /**
     * Incluye, además de los horarios de la cohorte normal de cada
     * matrícula aprobada, los de cualquier curso en recuperación que ya
     * tenga sección asignada (ver Matricula::todosLosHorarios()) -- sin
     * esto, un curso jalado que se repite en otro ciclo_curricular
     * quedaría invisible acá, porque no calza con ninguna matrícula por
     * carrera+ciclo_curricular+ciclo.
     *
     * @return Collection<int, Horario>
     */
    public function horariosDelEstudiante(Estudiante $estudiante): Collection
    {
        $matriculas = $estudiante->matriculas()->where('estado', 'aprobada')->get();

        $horarios = new Collection;

        foreach ($matriculas as $matricula) {
            $horarios = $horarios->merge($matricula->todosLosHorarios());
        }

        return $horarios->unique('id')->values()->load(['curso', 'carrera', 'ciclo', 'docente', 'dias']);
    }

    /**
     * @return Collection<int, Horario>
     */
    public function todos(): Collection
    {
        return Horario::query()->with(['curso', 'carrera', 'ciclo', 'docente', 'dias'])->get();
    }

    public function crear(Horario $horario, string $nombre, string $fecha, ?string $enlaceExterno = null, ?string $disponibleHasta = null, ?int $semana = null): Evaluacion
    {
        return Evaluacion::query()->create([
            'horario_id' => $horario->id,
            'semana' => $semana,
            'nombre' => $nombre,
            'fecha' => $fecha,
            'enlace_externo' => $enlaceExterno,
            'disponible_hasta' => $disponibleHasta,
            'estado' => EstadoEvaluacionEnum::BORRADOR,
        ]);
    }

    public function actualizarEnlace(Evaluacion $evaluacion, ?string $enlaceExterno, ?string $disponibleHasta = null): Evaluacion
    {
        $evaluacion->update([
            'enlace_externo' => $enlaceExterno,
            'disponible_hasta' => $disponibleHasta,
        ]);

        return $evaluacion;
    }

    public function actualizarSemana(Evaluacion $evaluacion, ?int $semana): Evaluacion
    {
        $evaluacion->update(['semana' => $semana]);

        return $evaluacion;
    }

    /**
     * @return Collection<int, Evaluacion>
     */
    public function evaluacionesDelHorario(Horario $horario): Collection
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->orderByDesc('fecha')
            ->get();
    }

    /**
     * @return Collection<int, Evaluacion>
     */
    public function evaluacionesPublicadasDelHorario(Horario $horario): Collection
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('estado', EstadoEvaluacionEnum::PUBLICADA)
            ->orderByDesc('fecha')
            ->get();
    }

    /**
     * @return Collection<int, Calificacion>
     */
    public function calificacionesDe(Evaluacion $evaluacion): Collection
    {
        return Calificacion::query()
            ->where('evaluacion_id', $evaluacion->id)
            ->with('estudiante')
            ->get()
            ->keyBy('estudiante_id');
    }

    public function calificar(Evaluacion $evaluacion, Estudiante $estudiante, float $nota, ?string $observaciones, ?int $registradoPor): Calificacion
    {
        return Calificacion::query()->updateOrCreate(
            ['evaluacion_id' => $evaluacion->id, 'estudiante_id' => $estudiante->id],
            ['nota_numerica' => $nota, 'observaciones' => $observaciones, 'registrado_por' => $registradoPor],
        );
    }

    /**
     * Importa notas desde las filas de un CSV/Excel -- típicamente
     * exportado de un Google Forms al que se le agregó una pregunta de
     * DNI, ya que el correo que exporta el Form por defecto no basta para
     * identificar sin ambigüedad al estudiante. Cada fila debe traer "dni"
     * y "nota" (0 a 20), y opcionalmente "observaciones". Solo califica a
     * estudiantes matriculados en el horario de la evaluación; cada fila
     * se procesa de forma independiente, así que una fila inválida no
     * afecta a las demás (mismo patrón que
     * MatriculaService::matricularDesdeFilas()).
     *
     * @param  SupportCollection<int, SupportCollection<string, mixed>>  $filas
     * @return array{exitosos: int, errores: list<array{fila: int, mensaje: string}>}
     */
    public function calificarDesdeFilas(Evaluacion $evaluacion, SupportCollection $filas, ?int $registradoPor): array
    {
        $exitosos = 0;
        $errores = [];

        $estudiantesPorDni = $this->estudiantesDelHorario($evaluacion->horario)->keyBy('dni');

        foreach ($filas as $indice => $fila) {
            try {
                $dni = trim((string) ($fila->get('dni') ?? ''));

                if ($dni === '') {
                    throw new InvalidArgumentException('La columna «dni» es obligatoria.');
                }

                $estudiante = $estudiantesPorDni->get($dni);

                if (! $estudiante) {
                    throw new InvalidArgumentException("No hay ningún estudiante matriculado en este horario con el DNI {$dni}.");
                }

                $notaValor = $fila->get('nota');

                if ($notaValor === null || trim((string) $notaValor) === '') {
                    throw new InvalidArgumentException('La columna «nota» es obligatoria.');
                }

                if (! is_numeric($notaValor)) {
                    throw new InvalidArgumentException("La nota «{$notaValor}» no es un número válido.");
                }

                $nota = (float) $notaValor;

                if ($nota < 0 || $nota > 20) {
                    throw new InvalidArgumentException('La nota debe estar entre 0 y 20.');
                }

                $observacionesValor = $fila->get('observaciones');
                $observaciones = $observacionesValor !== null && trim((string) $observacionesValor) !== ''
                    ? trim((string) $observacionesValor)
                    : null;

                $this->calificar($evaluacion, $estudiante, $nota, $observaciones, $registradoPor);

                $exitosos++;
            } catch (Throwable $e) {
                $errores[] = ['fila' => $indice + 2, 'mensaje' => $e->getMessage()];
            }
        }

        return ['exitosos' => $exitosos, 'errores' => $errores];
    }

    public function publicar(Evaluacion $evaluacion): void
    {
        $evaluacion->update(['estado' => EstadoEvaluacionEnum::PUBLICADA]);

        $usuarios = $this->estudiantesDelHorario($evaluacion->horario)
            ->map(fn (Estudiante $estudiante) => $estudiante->user)
            ->filter();

        $this->notificaciones->notificarVarios(
            $usuarios,
            TipoNotificacionEnum::EVALUACION_PUBLICADA,
            "Se publicó la evaluación \"{$evaluacion->nombre}\"",
            route('evaluaciones.show', $evaluacion->horario),
        );
    }

    /**
     * Evaluaciones de un horario con un enlace externo que el estudiante ya
     * puede resolver: deben estar publicadas y, si el docente puso una
     * fecha límite, todavía no haber pasado (ver Evaluacion::enlaceDisponible()).
     *
     * @return Collection<int, Evaluacion>
     */
    public function evaluacionesConEnlaceDelHorario(Horario $horario): Collection
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('estado', EstadoEvaluacionEnum::PUBLICADA)
            ->whereNotNull('enlace_externo')
            ->where(function ($query) {
                $query->whereNull('disponible_hasta')->orWhere('disponible_hasta', '>=', now());
            })
            ->orderByDesc('fecha')
            ->get();
    }

    /**
     * Calificaciones del estudiante en evaluaciones ya publicadas de un horario.
     *
     * @return Collection<int, Calificacion>
     */
    public function misCalificaciones(Estudiante $estudiante, Horario $horario): Collection
    {
        return Calificacion::query()
            ->where('estudiante_id', $estudiante->id)
            ->whereHas('evaluacion', function ($query) use ($horario) {
                $query->where('horario_id', $horario->id)->where('estado', EstadoEvaluacionEnum::PUBLICADA);
            })
            ->with('evaluacion')
            ->get();
    }

    /**
     * Cuántos exámenes mensuales entran en el promedio final de un curso
     * (los últimos N por fecha, ver misCalificaciones()): todo Ciclo dura
     * 6 meses de clases desde que se retiró el SIAGIE anual (que llegaba
     * a 8), así que son siempre 6.
     */
    private const EXAMENES_QUE_CUENTAN = 6;

    /**
     * Promedio de las calificaciones publicadas del estudiante en un
     * horario, considerando solo los últimos EXAMENES_QUE_CUENTAN
     * exámenes mensuales por fecha. Si hay menos registrados, promedia
     * los que existan. La ponderación por tipo de evaluación queda fuera
     * de alcance: hoy solo existe un tipo (mensual).
     */
    public function promedioDelEstudiante(Estudiante $estudiante, Horario $horario): ?float
    {
        $notas = $this->misCalificaciones($estudiante, $horario)
            ->sortByDesc(fn (Calificacion $calificacion) => $calificacion->evaluacion->fecha)
            ->take(self::EXAMENES_QUE_CUENTAN)
            ->pluck('nota_numerica');

        if ($notas->isEmpty()) {
            return null;
        }

        return round((float) $notas->avg(), 2);
    }

    /**
     * La letra de la nota final del estudiante en este horario, o null si
     * todavía no tiene ninguna calificación publicada -- misma regla que ya
     * usa LibretaService::calcularSituacionFinal() (letra C = desaprobado;
     * sin calificar nunca cuenta como desaprobado). Usado por
     * MigracionService para decidir qué cursos se arrastran como refuerzo
     * al migrar de ciclo.
     */
    public function notaLetraDelEstudiante(Estudiante $estudiante, Horario $horario): ?NotaLetraEnum
    {
        $promedio = $this->promedioDelEstudiante($estudiante, $horario);

        return $promedio !== null ? NotaLetraEnum::desde($promedio) : null;
    }

    /**
     * El desglose mes a mes del promedio del estudiante en un horario, para
     * la libreta de notas: cada elemento trae "mes" (label legible, ej.
     * "Marzo 2026") y "promedio", ordenados cronológicamente. Se agrupa por
     * la fecha de la evaluación (no de la calificación, que no tiene fecha
     * propia), así que un mes sin evaluaciones calificadas simplemente no
     * aparece en el desglose.
     *
     * @return SupportCollection<int, array{mes: string, promedio: float}>
     */
    public function promedioMensualDelEstudiante(Estudiante $estudiante, Horario $horario): SupportCollection
    {
        return $this->misCalificaciones($estudiante, $horario)
            ->groupBy(fn (Calificacion $calificacion) => $calificacion->evaluacion->fecha->format('Y-m'))
            ->sortKeys()
            ->map(fn (Collection $calificaciones, string $clave) => [
                'mes' => Carbon::createFromFormat('Y-m', $clave)->translatedFormat('F Y'),
                'promedio' => round((float) $calificaciones->pluck('nota_numerica')->avg(), 2),
            ])
            ->values();
    }

    /**
     * Notas del estudiante en todos sus cursos matriculados (de cualquier
     * ciclo), usada por la sección "Mis evaluaciones" del dashboard — sin
     * tener que entrar horario por horario a revisar cada uno.
     *
     * Cada elemento es un array con las claves "horario" (Horario),
     * "calificaciones" (Collection<int, Calificacion>) y "promedio" (?float).
     * Sin generics en el @return: el TValue de Collection no es covariante
     * (ver https://phpstan.org/blog/whats-up-with-template-covariant), así
     * que ninguna anotación de forma de array sobrevive a un ->map().
     */
    public function resumenDelEstudiante(Estudiante $estudiante): SupportCollection
    {
        return collect($this->horariosDelEstudiante($estudiante))->map(fn (Horario $horario) => [
            'horario' => $horario,
            'calificaciones' => $this->misCalificaciones($estudiante, $horario),
            'promedio' => $this->promedioDelEstudiante($estudiante, $horario),
        ]);
    }

    /**
     * El resumen anterior, agrupado por ciclo (más reciente primero) con el
     * promedio general de cada uno — usado por la sección "Mis evaluaciones"
     * del dashboard del estudiante.
     *
     * Cada elemento es un array con las claves "ciclo" (Ciclo), "cursos"
     * (la Collection que devuelve resumenDelEstudiante(), ya filtrada a ese
     * ciclo) y "promedioGeneral" (?float).
     */
    public function resumenDelEstudiantePorCiclo(Estudiante $estudiante): SupportCollection
    {
        return $this->resumenDelEstudiante($estudiante)
            ->groupBy(fn (array $item) => $item['horario']->ciclo->id)
            ->map(function ($cursos) {
                $promedios = $cursos->pluck('promedio')->filter();

                return [
                    'ciclo' => $cursos->first()['horario']->ciclo,
                    'cursos' => $cursos,
                    'promedioGeneral' => $promedios->isNotEmpty() ? round((float) $promedios->avg(), 2) : null,
                ];
            })
            ->sortByDesc(fn (array $grupo) => $grupo['ciclo']->id)
            ->values();
    }
}
