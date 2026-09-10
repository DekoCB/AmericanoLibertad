<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Services;

use App\Models\User;
use App\Modules\Academico\Enums\FranjaHorarioEnum;
use App\Modules\Academico\Models\Horario;
use App\Modules\Asistencia\Models\Asistencia;
use App\Modules\Certificados\Models\Certificado;
use App\Modules\Evaluaciones\Models\Calificacion;
use App\Modules\Evaluaciones\Models\Evaluacion;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Pagos\Enums\EstadoCuotaEnum;
use App\Modules\Pagos\Models\Cuota;
use App\Modules\Pagos\Models\Pago;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Constructor de reportes tabulares exportables. Cada método devuelve
 * ['columnas' => list<string>, 'filas' => list<list<string|int|float>>]
 * en el mismo formato para alimentar tanto la vista previa en pantalla
 * como los exportadores de Excel/CSV/PDF sin transformación adicional.
 *
 * El filtro común a todos es SIAGIE → Grupo (ciclo) → Carrera → Ciclo
 * curricular (I-VI) → Curso, en cascada, más franja institucional -- ya no
 * hay filtro por rango de fechas: el ciclo (que ya tiene su propio periodo)
 * alcanza para acotar el reporte a un periodo lectivo concreto. SIAGIE es
 * una etiqueta por matrícula independiente del Grupo (ver
 * Matricula::siagie_id), así que en los reportes que no giran en torno a
 * una Matricula (Académico, Operativo) se resuelve indirectamente vía los
 * estudiantes matriculados con ese SIAGIE; en "Mis evaluaciones" (por
 * docente, no por estudiante) no aplica y se ignora.
 */
class ReporteService
{
    /**
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function matricula(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $matriculas = $this->filtrarMatriculasPorFiltros(
            Matricula::query()->with(['estudiante', 'carrera', 'ciclo']),
            $cicloId,
            $carreraId,
            $cicloCurricular,
            $cursoId,
            $franja,
            $siagieId,
        )->latest('fecha_matricula')->get();

        return [
            'columnas' => ['Estudiante', 'DNI', 'Carrera', 'Ciclo curricular', 'Ciclo', 'Estado', 'Fecha de matrícula'],
            'filas' => $matriculas->map(fn (Matricula $matricula) => [
                $matricula->estudiante?->nombreCompleto() ?? '—',
                $matricula->estudiante->dni ?? '—',
                $matricula->carrera->name,
                $matricula->ciclo_curricular,
                $matricula->ciclo->nombre,
                $matricula->estado->label(),
                $matricula->fecha_matricula->format('d/m/Y'),
            ])->all(),
        ];
    }

    /**
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function academico(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $horarioIds = $this->horarioIdsFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja);
        $estudianteIds = $this->estudianteIdsConSiagie($siagieId);

        $calificaciones = Calificacion::query()
            ->with(['estudiante', 'evaluacion.horario.carrera', 'evaluacion.horario.curso'])
            ->when($horarioIds !== null, fn ($query) => $query->whereHas(
                'evaluacion',
                fn ($sub) => $sub->whereIn('horario_id', $horarioIds),
            ))
            ->when($estudianteIds !== null, fn ($query) => $query->whereIn('estudiante_id', $estudianteIds))
            ->latest('id')
            ->get();

        return [
            'columnas' => ['Estudiante', 'Carrera', 'Curso', 'Evaluación', 'Nota', 'Resultado'],
            'filas' => $calificaciones->map(fn (Calificacion $calificacion) => [
                $calificacion->estudiante?->nombreCompleto() ?? '—',
                $calificacion->evaluacion->horario->carrera->name,
                $calificacion->evaluacion->horario->curso->nombre,
                $calificacion->evaluacion->nombre,
                number_format((float) $calificacion->nota_numerica, 2),
                (float) $calificacion->nota_numerica >= 11 ? 'Aprobado' : 'Desaprobado',
            ])->all(),
        ];
    }

    /**
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function financiero(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $sinFiltros = $this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId);

        $pagos = Pago::query()
            ->with(['estudiante', 'concepto'])
            ->when(! $sinFiltros, fn ($query) => $query->whereHas(
                'estudiante.matriculas',
                fn ($sub) => $this->filtrarMatriculasPorFiltros($sub, $cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId),
            ))
            ->latest('fecha_pago')
            ->get();

        return [
            'columnas' => ['Estudiante', 'Concepto', 'Monto', 'Método', 'Estado', 'Fecha de pago'],
            'filas' => $pagos->map(fn (Pago $pago) => [
                $pago->estudiante?->nombreCompleto() ?? '—',
                $pago->concepto->nombre,
                number_format((float) $pago->monto, 2),
                $pago->metodo->label(),
                $pago->estado->label(),
                $pago->fecha_pago->format('d/m/Y'),
            ])->all(),
        ];
    }

    /**
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function certificados(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $sinFiltros = $this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId);

        $certificados = Certificado::query()
            ->with(['estudiante', 'matricula.carrera'])
            ->when(! $sinFiltros, fn ($query) => $query->whereHas(
                'matricula',
                fn ($sub) => $this->filtrarMatriculasPorFiltros($sub, $cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId),
            ))
            ->latest('fecha_emision')
            ->get();

        return [
            'columnas' => ['N.° certificado', 'Estudiante', 'Carrera', 'Duplicado', 'Fecha de emisión'],
            'filas' => $certificados->map(fn (Certificado $certificado) => [
                $certificado->numero,
                $certificado->estudiante?->nombreCompleto() ?? '—',
                $certificado->matricula !== null ? $certificado->matricula->carrera->name : '—',
                $certificado->es_duplicado ? 'Sí' : 'No',
                $certificado->fecha_emision->format('d/m/Y'),
            ])->all(),
        ];
    }

    /**
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function operativo(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $horarioIds = $this->horarioIdsFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja);
        $estudianteIds = $this->estudianteIdsConSiagie($siagieId);

        $asistencias = Asistencia::query()
            ->with(['estudiante', 'horario.carrera'])
            ->when($horarioIds !== null, fn ($query) => $query->whereIn('horario_id', $horarioIds))
            ->when($estudianteIds !== null, fn ($query) => $query->whereIn('estudiante_id', $estudianteIds))
            ->get()
            ->groupBy(fn (Asistencia $asistencia) => $asistencia->estudiante_id);

        $filas = $asistencias
            ->filter(fn ($registros) => $registros->first()->estudiante !== null)
            ->map(function ($registros) {
                $estudiante = $registros->first()->estudiante;
                $total = $registros->count();
                $presentes = $registros->whereIn('estado', ['presente', 'justificado'])->count();

                return [
                    $estudiante->nombreCompleto(),
                    $registros->first()->horario->carrera->name,
                    $total,
                    $presentes,
                    $total > 0 ? number_format($presentes / $total * 100, 1).'%' : '—',
                ];
            })->values()->all();

        return [
            'columnas' => ['Estudiante', 'Carrera', 'Sesiones registradas', 'Asistencias', '% Asistencia'],
            'filas' => $filas,
        ];
    }

    /**
     * Un estudiante por fila, con sus cuotas vencidas sin pagar agrupadas:
     * cuántas, cuánto suman y desde cuándo la más antigua está vencida.
     * Solo cuenta cuotas ya vencidas a hoy, sin importar el filtro elegido
     * -- eso es lo que define a un "deudor", no una fecha de corte manual.
     *
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function morosos(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $sinFiltros = $this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId);

        $cuotasVencidas = Cuota::query()
            ->where('estado', EstadoCuotaEnum::PENDIENTE)
            ->where('fecha_vencimiento', '<', now()->toDateString())
            ->when(! $sinFiltros, fn ($query) => $query->whereHas(
                'planPago.matricula',
                fn ($sub) => $this->filtrarMatriculasPorFiltros($sub, $cicloId, $carreraId, $cicloCurricular, $cursoId, $franja, $siagieId),
            ))
            ->with('planPago.matricula.estudiante', 'planPago.matricula.carrera')
            ->get()
            ->filter(fn (Cuota $cuota) => $cuota->planPago->matricula?->estudiante !== null)
            ->groupBy(fn (Cuota $cuota) => $cuota->planPago->matricula->estudiante_id);

        $filas = $cuotasVencidas
            ->map(function ($cuotas) {
                $matricula = $cuotas->first()->planPago->matricula;
                $estudiante = $matricula->estudiante;

                return [
                    $estudiante->nombreCompleto(),
                    $estudiante->dni,
                    $matricula->carrera->name,
                    $cuotas->count(),
                    number_format((float) $cuotas->sum('monto'), 2),
                    $cuotas->min('fecha_vencimiento')->format('d/m/Y'),
                ];
            })
            ->sortByDesc(fn (array $fila) => $fila[3])
            ->values()
            ->all();

        return [
            'columnas' => ['Estudiante', 'DNI', 'Carrera', 'Cuotas vencidas', 'Monto adeudado', 'Vencida desde'],
            'filas' => $filas,
        ];
    }

    /**
     * SIAGIE es una etiqueta por estudiante; este reporte lista
     * evaluaciones propias del docente (sin desglose por estudiante), así
     * que $siagieId no tiene nada que filtrar aquí -- se acepta solo para
     * que la firma sea uniforme con el resto de reportes.
     *
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function propio(User $docente, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja = null, ?int $siagieId = null): array
    {
        $horarioIds = $this->horarioIdsFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja);

        $evaluaciones = Evaluacion::query()
            ->with(['horario.carrera', 'horario.curso'])
            ->whereHas('horario', fn ($query) => $query->where('docente_id', $docente->id))
            ->when($horarioIds !== null, fn ($query) => $query->whereIn('horario_id', $horarioIds))
            ->latest('fecha')
            ->get();

        return [
            'columnas' => ['Evaluación', 'Carrera', 'Curso', 'Fecha', 'Estado'],
            'filas' => $evaluaciones->map(fn (Evaluacion $evaluacion) => [
                $evaluacion->nombre,
                $evaluacion->horario->carrera->name,
                $evaluacion->horario->curso->nombre,
                $evaluacion->fecha->format('d/m/Y'),
                $evaluacion->estado->label(),
            ])->all(),
        ];
    }

    private function sinFiltros(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja, ?int $siagieId = null): bool
    {
        return $cicloId === null && $carreraId === null && $cicloCurricular === null && $cursoId === null && $franja === null && $siagieId === null;
    }

    /**
     * IDs de estudiantes con al menos una Matricula etiquetada con este
     * SIAGIE (ver Matricula::siagie_id) -- es una etiqueta independiente
     * del Grupo/Ciclo, así que no se resuelve vía Horario. null significa
     * "no filtrar por SIAGIE".
     *
     * @return ?list<int>
     */
    private function estudianteIdsConSiagie(?int $siagieId): ?array
    {
        if ($siagieId === null) {
            return null;
        }

        return Matricula::query()->where('siagie_id', $siagieId)->pluck('estudiante_id')->unique()->values()->all();
    }

    /**
     * Horarios que coinciden con el Grupo (ciclo), Carrera, Ciclo
     * curricular y Curso elegidos en el selector en cascada, más la franja
     * institucional si se usa. null en cualquiera de los filtros significa
     * "no restringir por ese campo". Devuelve null si no se pidió ningún
     * filtro (para que el caller no aplique ninguna restricción en
     * absoluto).
     *
     * @return ?Collection<int, Horario>
     */
    private function horariosFiltrados(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja): ?Collection
    {
        if ($this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja)) {
            return null;
        }

        $franjaEnum = $franja !== null ? FranjaHorarioEnum::tryFrom($franja) : null;

        return Horario::query()
            ->with('dias')
            ->when($cicloId !== null, fn ($query) => $query->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($query) => $query->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($query) => $query->where('ciclo_curricular', $cicloCurricular))
            ->when($cursoId !== null, fn ($query) => $query->where('curso_id', $cursoId))
            ->get()
            ->filter(fn (Horario $horario) => $franjaEnum === null || $horario->franja() === $franjaEnum)
            ->values();
    }

    /**
     * @return ?list<int>
     */
    private function horarioIdsFiltrados(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja): ?array
    {
        return $this->horariosFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja)?->pluck('id')->all();
    }

    /**
     * Aplica el filtro de SIAGIE/Grupo/Carrera/Ciclo curricular/Curso/franja
     * a una consulta de Matricula. SIAGIE, ciclo, carrera y ciclo curricular
     * se filtran directo por columna (Matricula ya las tiene). Curso y
     * franja no existen ahí -- se resuelven vía Horario: un estudiante
     * matriculado en esa carrera+ciclo curricular+ciclo lleva
     * automáticamente cualquier curso de ese nivel, salvo que ese curso
     * tenga secciones paralelas, donde se exige la asignación explícita en
     * el pivote matricula_horario a uno de los horarios filtrados (mismo
     * criterio que Matricula::scopeDelHorario()).
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function filtrarMatriculasPorFiltros(Builder $query, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $franja, ?int $siagieId = null): Builder
    {
        $query = $query
            ->when($cicloId !== null, fn ($q) => $q->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($q) => $q->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($q) => $q->where('ciclo_curricular', $cicloCurricular))
            ->when($siagieId !== null, fn ($q) => $q->where('siagie_id', $siagieId));

        if ($cursoId === null && $franja === null) {
            return $query;
        }

        $horarios = $this->horariosFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $franja);

        if ($horarios === null || $horarios->isEmpty()) {
            return $query->whereIn('id', []);
        }

        // Si ciclo, carrera o ciclo curricular no venían fijos arriba, hace
        // falta acotar la matrícula a las combinaciones donde sí cae la
        // franja/curso.
        if ($cicloId === null || $carreraId === null || $cicloCurricular === null) {
            $combinaciones = $horarios
                ->map(fn (Horario $horario) => [
                    'carrera_id' => $horario->carrera_id,
                    'ciclo_curricular' => $horario->ciclo_curricular,
                    'ciclo_id' => $horario->ciclo_id,
                ])
                ->unique(fn (array $c) => $c['carrera_id'].'-'.$c['ciclo_curricular'].'-'.$c['ciclo_id'])
                ->values();

            $query = $this->filtrarPorCarreraCicloYGrupo($query, $combinaciones);
        }

        if ($cursoId === null) {
            return $query;
        }

        $tieneParalelos = Horario::query()->where('curso_id', $cursoId)->count() > 1;

        if (! $tieneParalelos) {
            return $query;
        }

        return $query->whereHas('horarios', fn ($sub) => $sub->whereIn('horarios.id', $horarios->pluck('id')));
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  Collection<int, array{carrera_id: int, ciclo_curricular: int, ciclo_id: int}>  $combinaciones
     * @return Builder<TModel>
     */
    private function filtrarPorCarreraCicloYGrupo(Builder $query, Collection $combinaciones): Builder
    {
        if ($combinaciones->isEmpty()) {
            return $query->whereIn('id', []);
        }

        return $query->where(function (Builder $q) use ($combinaciones) {
            foreach ($combinaciones as $c) {
                $q->orWhere(fn (Builder $qq) => $qq
                    ->where('carrera_id', $c['carrera_id'])
                    ->where('ciclo_curricular', $c['ciclo_curricular'])
                    ->where('ciclo_id', $c['ciclo_id']));
            }
        });
    }
}
