{{-- @var \App\Modules\Pagos\Enums\SerieReciboEnum $serie --}}
{{-- @var \App\Modules\Pagos\Support\DetalleRecibo $d --}}
{{-- @var int $anchoMm --}}
@php
    $soles = fn (float $monto): string => number_format($monto, 2);
@endphp

<div class="centrado">
    <img class="logo-ticket" src="{{ $serie->logoPath() }}" alt="Americano Libertad {{ $serie->centroCostoIniciales() }}">
    <p class="encabezado">{{ mb_strtoupper($d->razonSocial) }}</p>
    @if ($d->ruc !== '')
        <p class="encabezado">RUC: {{ $d->ruc }}</p>
    @endif
    <p class="encabezado">{{ mb_strtoupper($d->direccionInstitucion) }}</p>
    @if ($d->telefonoInstitucion !== '')
        <p class="encabezado">TELF.: {{ $d->telefonoInstitucion }}</p>
    @endif
</div>

<hr class="regla-solida">

<div class="centrado">
    <p class="titulo-comprobante">BOLETA</p>
    <p class="titulo-comprobante">{{ $serie->numeroCompleto($recibo->numero_recibo) }}</p>
</div>

<hr class="regla-solida">

<table class="datos">
    <tr><td class="etiqueta">F. EMISIÓN</td><td class="dos-puntos">:</td><td>{{ $d->emitidoEn->format('d-m-Y') }}</td></tr>
    <tr><td class="etiqueta">H. EMISIÓN</td><td class="dos-puntos">:</td><td>{{ $d->emitidoEn->format('H:i:s') }}</td></tr>
    <tr><td class="etiqueta">F. PAGO</td><td class="dos-puntos">:</td><td>{{ $d->fechaPago->format('d-m-Y') }}</td></tr>
    @if ($d->fechaVencimiento)
        <tr><td class="etiqueta">F. VENCIMIENTO</td><td class="dos-puntos">:</td><td>{{ $d->fechaVencimiento->format('d-m-Y') }}</td></tr>
    @endif
</table>

<table class="datos">
    <tr><td class="etiqueta">CLIENTE</td><td class="dos-puntos">:</td><td>{{ $d->cliente }}</td></tr>
    <tr><td class="etiqueta">DNI/RUC</td><td class="dos-puntos">:</td><td>{{ $d->dni }}</td></tr>
    <tr><td class="etiqueta">DIRECCIÓN</td><td class="dos-puntos">:</td><td>{{ $d->direccionCliente }}</td></tr>
    <tr><td class="etiqueta">AULA</td><td class="dos-puntos">:</td><td>{{ mb_strtoupper($d->aula) }}</td></tr>
</table>

<hr class="regla-solida">

<table class="items">
    <thead>
        <tr>
            <th class="c-cant">CANT</th>
            <th class="c-desc">DESCRIPCIÓN</th>
            <th class="c-num">P.UNIT</th>
            <th class="c-num">DESC.</th>
            <th class="c-num">OTROS</th>
            <th class="c-num">IMPORTE</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="c-cant">1</td>
            <td class="c-desc">{{ $d->descripcion }}</td>
            <td class="c-num">{{ $soles($d->precioUnitario) }}</td>
            <td class="c-num">{{ $soles($d->descuento) }}</td>
            <td class="c-num">{{ $soles($d->otrosCargos) }}</td>
            <td class="c-num">{{ $soles($d->total) }}</td>
        </tr>
    </tbody>
</table>

<hr class="regla-solida">

<table class="totales">
    <tr><td>VALOR DE VENTA</td><td class="importe">S/ {{ $soles($d->precioUnitario) }}</td></tr>
    <tr><td>DESCUENTO</td><td class="importe">- S/ {{ $soles($d->descuento) }}</td></tr>
    <tr><td>SUBTOTAL</td><td class="importe">S/ {{ $soles($d->precioUnitario - $d->descuento) }}</td></tr>
    <tr><td>OTROS CARGOS</td><td class="importe">+ S/ {{ $soles($d->otrosCargos) }}</td></tr>
    <tr class="total"><td>TOTAL A PAGAR</td><td class="importe">S/ {{ $soles($d->total) }}</td></tr>
</table>

<p class="son">SON: {{ $d->montoEnLetras }}</p>

<hr class="regla-solida">

<div class="adicional">
    <p class="adicional-titulo">Información adicional</p>
    @if ($d->cuota)
        <p><b>Cuota:</b> {{ $d->cuota }} — {{ $d->saldoCuota ? 'Parcial (saldo S/ '.$soles($d->saldoCuota).')' : 'Completo' }}</p>
    @endif
    @if ($d->origen)
        <p><b>Origen:</b> {{ mb_strtoupper($d->origen) }}</p>
    @endif
    <p><b>Método de pago:</b> {{ mb_strtoupper($d->metodoPago) }}</p>
    @foreach ($d->partes as $parte)
        <p class="parte">· {{ $parte['metodo'] }}: S/ {{ $soles($parte['monto']) }}</p>
    @endforeach
    @if ($d->numeroOperacion)
        <p><b>Nro. Operación:</b> {{ $d->numeroOperacion }}</p>
    @endif
    @if ($d->observacion)
        <p><b>Observación:</b> {{ $d->observacion }}</p>
    @endif
    <p><b>Atendido por:</b> {{ $d->atendidoPor }}</p>
</div>

<p class="gracias">Gracias por su pago</p>
