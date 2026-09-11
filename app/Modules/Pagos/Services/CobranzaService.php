<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Services;

use App\Modules\Academico\Enums\DiaSemanaEnum;
use App\Modules\Academico\Models\Horario;
use App\Modules\Academico\Models\HorarioDia;
use App\Modules\Matricula\Models\Estudiante;
use App\Modules\Pagos\Enums\EstadoCuotaEnum;
use App\Modules\Pagos\Enums\EstadoPagoEnum;
use App\Modules\Pagos\Enums\TipoConceptoEnum;
use App\Modules\Pagos\Models\ConceptoPago;
use App\Modules\Pagos\Models\Cuota;
use App\Modules\Pagos\Models\Pago;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Cobros: qué debe un estudiante puntual (vista individual del módulo de
 * Cobranza), o qué estudiantes deben uno o más conceptos dentro de un
 * Ciclo/Carrera/Ciclo curricular/Curso filtrado (vista grupal).
 *
 * "Deber" se resuelve distinto según el tipo de concepto, porque solo
 * Mensualidad tiene una obligación real registrada en el sistema (las
 * Cuotas de un PlanPago -- ver Matricula/PlanPago/Cuota). Los demás
 * conceptos (Matrícula, Certificado, Constancia, Penalidad, Otro) no
 * tienen ninguna obligación registrada de antemano: solo existe un Pago
 * si alguien ya intentó pagar. Ahí "deber" se interpreta como tener un
 * Pago Pendiente (esperando aprobación de Tesorería) o Rechazado (hay
 * que volver a pagar) para ese concepto -- la única señal real que ya
 * existe en el sistema para esos casos.
 */
class CobranzaService
{
    /**
     * @return array{cuotasPendientes: Collection<int, Cuota>, pagosPendientes: Collection<int, Pago>, pagosAprobados: Collection<int, Pago>}
     */
    public function deudaDeEstudiante(Estudiante $estudiante): array
    {
        $cuotasPendientes = Cuota::query()
            ->where('estado', EstadoCuotaEnum::PENDIENTE)
            ->whereHas('planPago.matricula', fn ($query) => $query->where('estudiante_id', $estudiante->id))
            ->with('planPago.matricula.carrera')
            ->orderBy('fecha_vencimiento')
            ->get();

        $pagosPendientes = Pago::query()
            ->where('estudiante_id', $estudiante->id)
            ->whereIn('estado', [EstadoPagoEnum::PENDIENTE, EstadoPagoEnum::RECHAZADO])
            ->with('concepto')
            ->latest('fecha_pago')
            ->get();

        // Lo ya cobrado (aprobado): el detalle completo de "ya pagado", a
        // diferencia de las dos colecciones de arriba que son deuda.
        $pagosAprobados = Pago::query()
            ->where('estudiante_id', $estudiante->id)
            ->where('estado', EstadoPagoEnum::APROBADO)
            ->with(['concepto', 'recibo', 'partes'])
            ->latest('fecha_pago')
            ->get();

        return [
            'cuotasPendientes' => $cuotasPendientes,
            'pagosPendientes' => $pagosPendientes,
            'pagosAprobados' => $pagosAprobados,
        ];
    }

    /**
     * La cuota de mensualidad que le toca pagar a continuación a un
     * estudiante (la de vencimiento más próximo, sin importar si ya venció
     * o no) -- usada por "Registrar pago" para vincular automáticamente el
     * pago a su Cuota cuando el concepto elegido es Mensualidad, en vez de
     * dejar el pago suelto sin Ciclo/Cuota (ver PagoService::registrar()).
     */
    public function cuotaPendienteMasProxima(Estudiante $estudiante): ?Cuota
    {
        return Cuota::query()
            ->where('estado', EstadoCuotaEnum::PENDIENTE)
            ->whereHas('planPago.matricula', fn ($query) => $query->where('estudiante_id', $estudiante->id))
            ->with('planPago.matricula.ciclo')
            ->orderBy('fecha_vencimiento')
            ->first();
    }

    /**
     * @param  list<int>  $conceptoIds
     * @return array{columnas: list<string>, filas: list<array<int, string|int|float>>}
     */
    public function deudoresPorConceptos(array $conceptoIds, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): array
    {
        $conceptos = ConceptoPago::query()->whereIn('id', $conceptoIds)->get();

        $filas = [];

        foreach ($conceptos as $concepto) {
            $filasDelConcepto = $concepto->tipo === TipoConceptoEnum::MENSUALIDAD
                ? $this->deudoresMensualidad($concepto, $cicloId, $carreraId, $cicloCurricular, $cursoId, $dia)
                : $this->deudoresConceptoLibre($concepto, $cicloId, $carreraId, $cicloCurricular, $cursoId, $dia);

            array_push($filas, ...$filasDelConcepto);
        }

        return [
            'columnas' => ['Estudiante', 'DNI', 'Carrera', 'Concepto', 'Detalle', 'Monto'],
            'filas' => $filas,
        ];
    }

    /**
     * @return list<array<int, string|int|float>>
     */
    private function deudoresMensualidad(ConceptoPago $concepto, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): array
    {
        $cuotas = Cuota::query()
            ->where('estado', EstadoCuotaEnum::PENDIENTE)
            ->whereHas('planPago.matricula', fn ($sub) => $this->filtrarMatriculas($sub, $cicloId, $carreraId, $cicloCurricular, $cursoId, $dia))
            ->with('planPago.matricula.estudiante', 'planPago.matricula.carrera')
            ->get()
            ->filter(fn (Cuota $cuota) => $cuota->planPago->matricula?->estudiante !== null);

        return $cuotas->map(function (Cuota $cuota) use ($concepto) {
            $matricula = $cuota->planPago->matricula;
            $estudiante = $matricula->estudiante;
            $vencida = $cuota->estaVencida();

            return [
                $estudiante->nombreCompleto(),
                $estudiante->dni,
                $matricula->carrera->name,
                $concepto->nombre,
                'Cuota '.$cuota->numero.' — '.($vencida ? 'vencida desde ' : 'vence el ').$cuota->fecha_vencimiento->format('d/m/Y'),
                number_format($cuota->saldoPendiente(), 2),
            ];
        })->values()->all();
    }

    /**
     * @return list<array<int, string|int|float>>
     */
    private function deudoresConceptoLibre(ConceptoPago $concepto, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): array
    {
        $sinFiltros = $this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $dia);

        $pagos = Pago::query()
            ->where('concepto_id', $concepto->id)
            ->whereIn('estado', [EstadoPagoEnum::PENDIENTE, EstadoPagoEnum::RECHAZADO])
            ->when(! $sinFiltros, fn ($query) => $query->whereHas(
                'estudiante.matriculas',
                fn ($sub) => $this->filtrarMatriculas($sub, $cicloId, $carreraId, $cicloCurricular, $cursoId, $dia),
            ))
            ->with('estudiante.carreraActual')
            ->get();

        return $pagos->map(function (Pago $pago) use ($concepto) {
            $estudiante = $pago->estudiante;
            $carrera = $estudiante?->carreraActual;

            return [
                $estudiante?->nombreCompleto() ?? '—',
                $estudiante !== null ? $estudiante->dni : '—',
                $carrera !== null ? $carrera->name : '—',
                $concepto->nombre,
                $pago->estado === EstadoPagoEnum::RECHAZADO
                    ? 'Rechazado'.($pago->motivo_rechazo ? ' — '.$pago->motivo_rechazo : '')
                    : 'Pendiente de aprobación',
                number_format((float) $pago->monto, 2),
            ];
        })->values()->all();
    }

    private function sinFiltros(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): bool
    {
        return $cicloId === null && $carreraId === null && $cicloCurricular === null && $cursoId === null && $dia === null;
    }

    /**
     * Horarios que coinciden con el Ciclo, Carrera, Ciclo curricular
     * y Curso elegidos, más el día de la semana (lunes a domingo) si se
     * usa -- mismo criterio que ReporteService, ver ese archivo para el
     * razonamiento completo.
     *
     * @return ?Collection<int, Horario>
     */
    private function horariosFiltrados(?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): ?Collection
    {
        if ($this->sinFiltros($cicloId, $carreraId, $cicloCurricular, $cursoId, $dia)) {
            return null;
        }

        $diaEnum = $dia !== null ? DiaSemanaEnum::tryFrom($dia) : null;

        return Horario::query()
            ->with('dias')
            ->when($cicloId !== null, fn ($query) => $query->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($query) => $query->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($query) => $query->where('ciclo_curricular', $cicloCurricular))
            ->when($cursoId !== null, fn ($query) => $query->where('curso_id', $cursoId))
            ->get()
            ->filter(fn (Horario $horario) => $diaEnum === null || $horario->dias->contains(fn (HorarioDia $horarioDia) => $horarioDia->dia_semana === $diaEnum))
            ->values();
    }

    /**
     * Aplica el filtro de Ciclo/Carrera/Ciclo curricular/Curso/día a una
     * consulta de Matricula. Ciclo, carrera y ciclo curricular se filtran
     * directo por columna; curso y día se resuelven vía Horario,
     * exigiendo la asignación explícita en matricula_horario cuando el
     * curso tiene secciones paralelas (mismo criterio que
     * Matricula::scopeDelHorario() y ReporteService).
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function filtrarMatriculas(Builder $query, ?int $cicloId, ?int $carreraId, ?int $cicloCurricular, ?int $cursoId, ?string $dia): Builder
    {
        $query = $query
            ->when($cicloId !== null, fn ($q) => $q->where('ciclo_id', $cicloId))
            ->when($carreraId !== null, fn ($q) => $q->where('carrera_id', $carreraId))
            ->when($cicloCurricular !== null, fn ($q) => $q->where('ciclo_curricular', $cicloCurricular));

        if ($cursoId === null && $dia === null) {
            return $query;
        }

        $horarios = $this->horariosFiltrados($cicloId, $carreraId, $cicloCurricular, $cursoId, $dia);

        if ($horarios === null || $horarios->isEmpty()) {
            return $query->whereIn('id', []);
        }

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
