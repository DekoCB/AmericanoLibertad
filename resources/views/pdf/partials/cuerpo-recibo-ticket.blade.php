{{-- @var \App\Modules\Pagos\Enums\SerieReciboEnum $serie --}}
{{-- @var int $anchoMm --}}
<div class="centrado">
    <img class="logo-ticket" src="{{ $serie->logoPath() }}" alt="Americano Libertad {{ $serie->centroCostoIniciales() }}">
    <p class="nombre-colegio">INSTITUTO AMERICANO LIBERTAD</p>
    <p class="subtitulo">Instituto Superior Tecnológico Privado · {{ $serie->centroCostoIniciales() }}</p>
</div>

<hr class="regla-ticket">

<div class="centrado">
    <p class="nombre-colegio">{{ $serie->titulo() }}</p>
    <p class="subtitulo">N.° {{ $serie->numeroCompleto($recibo->numero_recibo) }}</p>
</div>

<hr class="regla-ticket">

<table class="linea">
    <tr><td class="etiqueta">Fecha emisión</td><td class="valor">{{ $recibo->emitido_en->format('d/m/Y') }}</td></tr>
    <tr><td class="etiqueta">Fecha de pago</td><td class="valor">{{ $pago->fecha_pago->format('d/m/Y') }}</td></tr>
    <tr><td class="etiqueta">Alumno(a)</td><td class="valor">{{ $pago->estudiante?->nombreCompleto() ?? '—' }}</td></tr>
    <tr><td class="etiqueta">DNI</td><td class="valor">{{ $pago->estudiante?->dni ?? '—' }}</td></tr>
</table>

<div class="seccion">
    <p class="seccion-titulo">Concepto</p>
    <table class="linea">
        <tr>
            <td>{{ $pago->concepto->nombre }}{{ $pago->detalle ? ' — '.$pago->detalle : '' }}</td>
            <td class="valor">S/ {{ number_format((float) $pago->monto, 2) }}</td>
        </tr>
    </table>
</div>

@if ($pago->partes->count() > 1)
    <div class="seccion">
        <p class="seccion-titulo">Partes del pago</p>
        <table class="linea">
            @foreach ($pago->partes as $parte)
                <tr>
                    <td class="etiqueta">{{ $parte->metodo->label() }}</td>
                    <td class="valor">S/ {{ number_format((float) $parte->monto, 2) }}</td>
                </tr>
            @endforeach
        </table>
    </div>
@endif

<p class="monto-total">Total: S/ {{ number_format((float) $pago->monto, 2) }}</p>

<hr class="regla-ticket">

<table class="linea">
    <tr><td class="etiqueta">Cuota</td><td class="valor">
        @if ($pago->cuota)
            {{ $pago->cuota->numero }}/{{ $pago->cuota->planPago->numero_cuotas }}
            @if ($pago->cuota->saldoPendiente() > 0.0)
                (Saldo S/ {{ number_format($pago->cuota->saldoPendiente(), 2) }})
            @endif
        @else
            —
        @endif
    </td></tr>
    <tr><td class="etiqueta">Ciclo</td><td class="valor">{{ $pago->cuota?->planPago?->matricula?->ciclo?->nombre ?? '—' }}</td></tr>
    <tr><td class="etiqueta">Medio de pago</td><td class="valor">{{ $pago->metodo->label() }}</td></tr>
</table>

@if ($pago->observacion)
    <div class="seccion">
        <p class="seccion-titulo">Observación</p>
        <p>{{ $pago->observacion }}</p>
    </div>
@endif

<p class="pie-ticket">{{ $serie->titulo() }} N.° {{ $serie->numeroCompleto($recibo->numero_recibo) }}<br>Emitido: {{ $recibo->emitido_en->format('d/m/Y H:i') }}</p>
