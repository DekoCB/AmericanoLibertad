<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Services;

use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\NotaLetraEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Evaluaciones\Models\Calificacion;
use App\Modules\Evaluaciones\Models\Comportamiento;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Notificaciones\Enums\TipoNotificacionEnum;
use App\Modules\Notificaciones\Services\NotificacionService;
use Illuminate\Database\Eloquent\Collection;
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

    /**
     * Crea (si todavía no existen) el Examen parcial y el Examen final de un
     * horario -- a diferencia de las Continuas, el Examen es fijo, uno por
     * mitad, y no lo crea el docente a mano. Idempotente -- se puede llamar
     * en cada visita a la pantalla de calificar sin duplicar nada, igual
     * que CursoVirtualService::activarParaHorario().
     */
    public function sembrarExamenes(Horario $horario): void
    {
        foreach (MitadCicloEnum::cases() as $mitad) {
            Evaluacion::query()->firstOrCreate([
                'horario_id' => $horario->id,
                'mitad' => $mitad,
                'tipo' => TipoEvaluacionEnum::EXAMEN,
            ], [
                'estado' => EstadoEvaluacionEnum::BORRADOR,
            ]);
        }
    }

    /**
     * Crea una nueva evaluación Continua en una mitad del horario. Sin
     * nombre, se autonumera como "C{siguiente}" según cuántas continuas ya
     * tiene esa mitad -- así un docente que no quiere pensar en nombres
     * simplemente obtiene C1, C2, C3… en el orden en que las crea.
     */
    public function crearContinua(Horario $horario, MitadCicloEnum $mitad, ?string $nombre, string $fecha, ?string $enlaceExterno = null, ?string $disponibleHasta = null): Evaluacion
    {
        $siguiente = $this->continuasDeLaMitad($horario, $mitad)->count() + 1;

        return Evaluacion::query()->create([
            'horario_id' => $horario->id,
            'tipo' => TipoEvaluacionEnum::CONTINUA,
            'mitad' => $mitad,
            'nombre' => $nombre ?: "C{$siguiente}",
            'fecha' => $fecha,
            'enlace_externo' => $enlaceExterno,
            'disponible_hasta' => $disponibleHasta,
            'estado' => EstadoEvaluacionEnum::BORRADOR,
        ]);
    }

    /**
     * Corrige el nombre/fecha/enlace de una Continua ya creada -- por
     * ejemplo, si el docente se equivocó al ingresarla.
     */
    public function actualizarContinua(Evaluacion $continua, ?string $nombre, string $fecha, ?string $enlaceExterno = null, ?string $disponibleHasta = null): Evaluacion
    {
        $continua->update([
            'nombre' => $nombre ?: $continua->nombre,
            'fecha' => $fecha,
            'enlace_externo' => $enlaceExterno,
            'disponible_hasta' => $disponibleHasta,
        ]);

        return $continua;
    }

    /**
     * Borra una Continua y, en cascada (FK de calificaciones), las notas
     * que ya tuviera registradas -- por ejemplo, una evaluación de prueba
     * creada por error. El Examen no se puede borrar por acá: es fijo, uno
     * por mitad, sembrado automáticamente.
     */
    public function eliminarContinua(Evaluacion $continua): void
    {
        if (! $continua->esContinua()) {
            throw new InvalidArgumentException('Solo se pueden eliminar evaluaciones Continuas; el Examen es fijo por mitad.');
        }

        $continua->delete();
    }

    /**
     * @return Collection<int, Evaluacion>
     */
    public function continuasDeLaMitad(Horario $horario, MitadCicloEnum $mitad): Collection
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', $mitad)
            ->where('tipo', TipoEvaluacionEnum::CONTINUA)
            ->orderBy('id')
            ->get();
    }

    public function examenDeLaMitad(Horario $horario, MitadCicloEnum $mitad): ?Evaluacion
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', $mitad)
            ->where('tipo', TipoEvaluacionEnum::EXAMEN)
            ->first();
    }

    public function actualizarFecha(Evaluacion $evaluacion, ?string $fecha): Evaluacion
    {
        $evaluacion->update(['fecha' => $fecha]);

        return $evaluacion;
    }

    public function actualizarEnlace(Evaluacion $evaluacion, ?string $enlaceExterno, ?string $disponibleHasta = null): Evaluacion
    {
        $evaluacion->update([
            'enlace_externo' => $enlaceExterno,
            'disponible_hasta' => $disponibleHasta,
        ]);

        return $evaluacion;
    }

    /**
     * Todas las evaluaciones (continuas + examen) de un horario, ordenadas
     * por mitad y luego por tipo.
     *
     * @return Collection<int, Evaluacion>
     */
    public function evaluacionesDelHorario(Horario $horario): Collection
    {
        return Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->orderBy('mitad')
            ->orderBy('tipo')
            ->orderBy('id')
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

    /**
     * Publica todas las evaluaciones (continuas + examen) de una mitad del
     * horario de una sola vez -- una sola notificación a los estudiantes,
     * no una por columna.
     */
    public function publicarMitad(Horario $horario, MitadCicloEnum $mitad): void
    {
        $evaluaciones = Evaluacion::query()
            ->where('horario_id', $horario->id)
            ->where('mitad', $mitad)
            ->where('estado', EstadoEvaluacionEnum::BORRADOR)
            ->get();

        if ($evaluaciones->isEmpty()) {
            return;
        }

        Evaluacion::query()
            ->whereIn('id', $evaluaciones->pluck('id'))
            ->update(['estado' => EstadoEvaluacionEnum::PUBLICADA]);

        $usuarios = $this->estudiantesDelHorario($horario)
            ->map(fn (Estudiante $estudiante) => $estudiante->user)
            ->filter();

        $this->notificaciones->notificarVarios(
            $usuarios,
            TipoNotificacionEnum::EVALUACION_PUBLICADA,
            "Se publicaron las notas de la mitad {$mitad->label()} de {$horario->curso->nombre}",
            route('evaluaciones.show', $horario),
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
            ->orderBy('mitad')
            ->orderBy('tipo')
            ->orderBy('id')
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
     * Las notas de UN estudiante para una lista de evaluaciones, en una
     * sola consulta -- evita ir a la base de datos evaluación por
     * evaluación (el cuello de botella real de antes: con muchas
     * continuas y muchos estudiantes, las consultas se multiplicaban una
     * por una hasta agotar el tiempo de espera del servidor).
     *
     * @param  SupportCollection<int, Evaluacion>  $columnas
     * @return SupportCollection<int, float> keyed by evaluacion_id
     */
    private function notasDelEstudiante(Estudiante $estudiante, SupportCollection $columnas): SupportCollection
    {
        if ($columnas->isEmpty()) {
            return collect();
        }

        return Calificacion::query()
            ->where('estudiante_id', $estudiante->id)
            ->whereIn('evaluacion_id', $columnas->pluck('id'))
            ->get()
            ->mapWithKeys(fn (Calificacion $calificacion) => [$calificacion->evaluacion_id => (float) $calificacion->nota_numerica]);
    }

    /**
     * P1 o P2 de TODOS los estudiantes a la vez, en un puñado fijo de
     * consultas (nunca una por estudiante ni una por evaluación) -- lo usa
     * la grilla de calificación, que antes repetía la consulta de notas
     * por cada combinación de estudiante y columna.
     *
     * El promedio de las Continuas se calcula siempre entre las que
     * realmente tienen nota (sean 1, 4 o 10) -- no exige un número fijo.
     * Null si el Examen no tiene nota, o si ninguna Continua la tiene
     * todavía (no hay con qué promediar el 60%).
     *
     * @param  Collection<int, Estudiante>  $estudiantes
     * @return SupportCollection keyed by estudiante_id (value: ?float)
     */
    public function promediosMitadDeTodos(Collection $estudiantes, Horario $horario, MitadCicloEnum $mitad, bool $soloPublicadas = false): SupportCollection
    {
        $examen = $this->examenDeLaMitad($horario, $mitad);

        if ($examen === null || ($soloPublicadas && ! $examen->estaPublicada())) {
            return $estudiantes->mapWithKeys(fn (Estudiante $estudiante) => [$estudiante->id => null]);
        }

        $continuasQueCuentan = $this->continuasDeLaMitad($horario, $mitad)
            ->filter(fn (Evaluacion $continua) => ! $soloPublicadas || $continua->estaPublicada());

        $columnas = (clone $continuasQueCuentan)->push($examen);

        $calificaciones = Calificacion::query()
            ->whereIn('evaluacion_id', $columnas->pluck('id'))
            ->get()
            ->groupBy('estudiante_id');

        return $estudiantes->mapWithKeys(function (Estudiante $estudiante) use ($calificaciones, $continuasQueCuentan, $examen) {
            $delEstudiante = $calificaciones->get($estudiante->id, collect())->keyBy('evaluacion_id');

            $notaExamen = $delEstudiante->get($examen->id)?->nota_numerica;

            if ($notaExamen === null) {
                return [$estudiante->id => null];
            }

            $notasContinuas = $continuasQueCuentan
                ->map(fn (Evaluacion $continua) => $delEstudiante->get($continua->id)?->nota_numerica)
                ->filter(fn ($nota) => $nota !== null);

            if ($notasContinuas->isEmpty()) {
                return [$estudiante->id => null];
            }

            $promedio = round(((float) $notasContinuas->avg() * 0.6) + ((float) $notaExamen * 0.4), 2);

            return [$estudiante->id => $promedio];
        });
    }

    public function promedioMitad(Estudiante $estudiante, Horario $horario, MitadCicloEnum $mitad, bool $soloPublicadas = false): ?float
    {
        return $this->promediosMitadDeTodos(new Collection([$estudiante]), $horario, $mitad, $soloPublicadas)->get($estudiante->id);
    }

    /**
     * El Promedio Final de TODOS los estudiantes a la vez (promedio de P1 y
     * P2) -- misma razón que promediosMitadDeTodos(): un puñado fijo de
     * consultas, no una cascada por estudiante.
     *
     * @param  Collection<int, Estudiante>  $estudiantes
     * @return SupportCollection keyed by estudiante_id (value: ?float)
     */
    public function promediosFinalesDeTodos(Collection $estudiantes, Horario $horario, bool $soloPublicadas = false): SupportCollection
    {
        $p1 = $this->promediosMitadDeTodos($estudiantes, $horario, MitadCicloEnum::PRIMERA, $soloPublicadas);
        $p2 = $this->promediosMitadDeTodos($estudiantes, $horario, MitadCicloEnum::SEGUNDA, $soloPublicadas);

        return $estudiantes->mapWithKeys(function (Estudiante $estudiante) use ($p1, $p2) {
            $uno = $p1->get($estudiante->id);
            $dos = $p2->get($estudiante->id);

            if ($uno === null || $dos === null) {
                return [$estudiante->id => null];
            }

            return [$estudiante->id => round(($uno + $dos) / 2, 2)];
        });
    }

    /**
     * Promedio Final = promedio(P1, P2). Null si falta cualquiera de las
     * dos mitades.
     */
    public function promedioFinalDelEstudiante(Estudiante $estudiante, Horario $horario, bool $soloPublicadas = false): ?float
    {
        return $this->promediosFinalesDeTodos(new Collection([$estudiante]), $horario, $soloPublicadas)->get($estudiante->id);
    }

    /**
     * La letra de la nota final del estudiante en este horario, o null si
     * todavía no tiene Promedio Final publicado -- misma regla que ya usa
     * LibretaService::calcularSituacionFinal() (letra C = desaprobado; sin
     * calificar nunca cuenta como desaprobado). Usado por MigracionService
     * para decidir qué cursos se arrastran como refuerzo al migrar de
     * ciclo.
     */
    public function notaLetraDelEstudiante(Estudiante $estudiante, Horario $horario): ?NotaLetraEnum
    {
        $promedio = $this->promedioFinalDelEstudiante($estudiante, $horario, soloPublicadas: true);

        return $promedio !== null ? NotaLetraEnum::desde($promedio) : null;
    }

    /**
     * El desglose completo del estudiante en un horario para la libreta y
     * la pantalla de calificación: la lista de Continuas (con su nombre y
     * nota) + la nota del Examen + el promedio, para cada mitad.
     *
     * @return array{primera: array{continuas: list<array{nombre: string, nota: ?float}>, examen: ?float, promedio: ?float}, segunda: array{continuas: list<array{nombre: string, nota: ?float}>, examen: ?float, promedio: ?float}}
     */
    public function resumenMitadesDelEstudiante(Estudiante $estudiante, Horario $horario, bool $soloPublicadas = true): array
    {
        $armar = function (MitadCicloEnum $mitad) use ($estudiante, $horario, $soloPublicadas): array {
            $continuas = $this->continuasDeLaMitad($horario, $mitad);
            $examen = $this->examenDeLaMitad($horario, $mitad);
            $columnas = (clone $continuas)->when($examen, fn (SupportCollection $c) => $c->push($examen));

            $notas = $this->notasDelEstudiante($estudiante, $columnas);
            $visible = fn (Evaluacion $evaluacion) => ! $soloPublicadas || $evaluacion->estaPublicada();

            $continuasConNota = $continuas
                ->map(fn (Evaluacion $continua) => [
                    'nombre' => $continua->nombre(),
                    'nota' => $visible($continua) ? $notas->get($continua->id) : null,
                ])
                ->values()
                ->all();

            return [
                'continuas' => $continuasConNota,
                'examen' => $examen !== null && $visible($examen) ? $notas->get($examen->id) : null,
                'promedio' => $this->promedioMitad($estudiante, $horario, $mitad, $soloPublicadas),
            ];
        };

        return [
            'primera' => $armar(MitadCicloEnum::PRIMERA),
            'segunda' => $armar(MitadCicloEnum::SEGUNDA),
        ];
    }

    public function registrarComportamiento(Horario $horario, Estudiante $estudiante, float $nota, ?int $registradoPor): Comportamiento
    {
        return Comportamiento::query()->updateOrCreate(
            ['horario_id' => $horario->id, 'estudiante_id' => $estudiante->id],
            ['nota_numerica' => $nota, 'registrado_por' => $registradoPor],
        );
    }

    /**
     * @return Collection<int, Comportamiento>
     */
    public function comportamientosDelHorario(Horario $horario): Collection
    {
        return Comportamiento::query()
            ->where('horario_id', $horario->id)
            ->get()
            ->keyBy('estudiante_id');
    }

    public function comportamientoDelEstudiante(Horario $horario, Estudiante $estudiante): ?Comportamiento
    {
        return Comportamiento::query()
            ->where('horario_id', $horario->id)
            ->where('estudiante_id', $estudiante->id)
            ->first();
    }

    /**
     * Notas del estudiante en todos sus cursos matriculados (de cualquier
     * ciclo), usada por la sección "Mis evaluaciones" del dashboard — sin
     * tener que entrar horario por horario a revisar cada uno.
     *
     * Cada elemento es un array con las claves "horario" (Horario),
     * "calificaciones" (Collection<int, Calificacion>) y "promedio" (?float,
     * el Promedio Final). Sin generics en el @return: el TValue de
     * Collection no es covariante (ver
     * https://phpstan.org/blog/whats-up-with-template-covariant), así que
     * ninguna anotación de forma de array sobrevive a un ->map().
     */
    public function resumenDelEstudiante(Estudiante $estudiante): SupportCollection
    {
        return collect($this->horariosDelEstudiante($estudiante))->map(fn (Horario $horario) => [
            'horario' => $horario,
            'calificaciones' => $this->misCalificaciones($estudiante, $horario),
            'promedio' => $this->promedioFinalDelEstudiante($estudiante, $horario, soloPublicadas: true),
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
