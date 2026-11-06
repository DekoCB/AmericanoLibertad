<?php

declare(strict_types=1);

namespace App\Modules\Pagos\Support;

use App\Modules\Matricula\Models\Matricula;
use App\Modules\Pagos\Models\Pago;
use App\Modules\Pagos\Models\Recibo;
use Illuminate\Support\Carbon;

/**
 * Todos los datos que imprime un recibo (ticket o A4), ya resueltos a
 * texto: así ambas plantillas muestran exactamente lo mismo y el cálculo
 * del alto del ticket (ReciboService::alturaTicketMm()) mide los mismos
 * textos que luego se imprimen.
 */
final class DetalleRecibo
{
    /**
     * @param  list<array{metodo: string, monto: float}>  $partes
     */
    public function __construct(
        public readonly string $razonSocial,
        public readonly string $ruc,
        public readonly string $direccionInstitucion,
        public readonly string $telefonoInstitucion,
        public readonly Carbon $emitidoEn,
        public readonly Carbon $fechaPago,
        public readonly ?Carbon $fechaVencimiento,
        public readonly string $cliente,
        public readonly string $dni,
        public readonly string $direccionCliente,
        public readonly string $aula,
        public readonly string $descripcion,
        public readonly float $precioUnitario,
        public readonly float $descuento,
        public readonly float $otrosCargos,
        public readonly float $total,
        public readonly string $montoEnLetras,
        public readonly ?string $cuota,
        public readonly ?float $saldoCuota,
        public readonly ?string $origen,
        public readonly string $metodoPago,
        public readonly ?string $numeroOperacion,
        public readonly array $partes,
        public readonly ?string $observacion,
        public readonly string $atendidoPor,
    ) {}

    public static function desde(Pago $pago, Recibo $recibo): self
    {
        $pago->loadMissing([
            'estudiante.carreraActual',
            'concepto',
            'cargoAdicional',
            'partes',
            'cuota.planPago.matricula.ciclo',
            'cuota.planPago.matricula.carrera',
            'aprobadoPor',
            'registradoPor',
        ]);

        $estudiante = $pago->estudiante;
        $cuota = $pago->cuota;
        $total = (float) $pago->monto;

        $saldo = $cuota?->saldoPendiente();

        return new self(
            razonSocial: (string) config('institucion.razon_social'),
            ruc: (string) config('institucion.ruc'),
            direccionInstitucion: (string) config('institucion.direccion'),
            telefonoInstitucion: (string) config('institucion.telefono'),
            emitidoEn: $recibo->emitido_en,
            fechaPago: $pago->fecha_pago,
            fechaVencimiento: $cuota?->fecha_vencimiento,
            cliente: $estudiante ? mb_strtoupper(trim("{$estudiante->apellidos} {$estudiante->nombres}")) : '—',
            dni: $estudiante->dni ?? '—',
            direccionCliente: filled($estudiante?->direccion) ? (string) $estudiante->direccion : '—',
            aula: self::aula($pago),
            descripcion: mb_strtoupper($pago->nombreConcepto().($pago->detalle ? ' — '.$pago->detalle : '')),
            precioUnitario: $total,
            descuento: 0.0,
            otrosCargos: 0.0,
            total: $total,
            montoEnLetras: MontoEnLetras::soles($total),
            cuota: $cuota ? "{$cuota->numero} de {$cuota->planPago->numero_cuotas}" : null,
            saldoCuota: $saldo !== null && $saldo > 0.0 ? $saldo : null,
            origen: $pago->origen?->label(),
            metodoPago: $pago->metodo->label(),
            numeroOperacion: $pago->numero_operacion,
            partes: $pago->partes->count() > 1
                ? $pago->partes->map(fn ($parte) => ['metodo' => $parte->metodo->label(), 'monto' => (float) $parte->monto])->values()->all()
                : [],
            observacion: filled($pago->observacion) ? $pago->observacion : null,
            atendidoPor: $pago->aprobadoPor?->name ?? $pago->registradoPor?->name ?? '—',
        );
    }

    /**
     * Carrera + ciclo curricular de la matrícula a la que pertenece el pago
     * (vía la cuota); si el pago no es de una cuota, la última matrícula del
     * estudiante; y si no tiene ninguna, al menos su carrera actual.
     */
    private static function aula(Pago $pago): string
    {
        /** @var Matricula|null $matricula */
        $matricula = $pago->cuota?->planPago?->matricula
            ?? $pago->estudiante?->matriculas()->with(['carrera', 'ciclo'])->latest('fecha_matricula')->first();

        if ($matricula === null) {
            return $pago->estudiante?->carreraActual?->name
                ? $pago->estudiante->carreraActual->name
                : '—';
        }

        $romanos = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        $ciclo = $romanos[$matricula->ciclo_curricular] ?? (string) $matricula->ciclo_curricular;

        $partes = array_filter([
            $matricula->carrera?->name,
            $matricula->ciclo_curricular ? "{$ciclo} ciclo" : null,
            $matricula->ciclo?->nombre,
        ]);

        return $partes === [] ? '—' : implode(' · ', $partes);
    }
}
