{{-- @var \App\Modules\Pagos\Enums\SerieReciboEnum $serie --}}
{{-- @var \App\Modules\Pagos\Support\DetalleRecibo $d --}}
@php
    $soles = fn (float $monto): string => number_format($monto, 2);
@endphp

<table class="encabezado">
    <tr>
        <td class="logo-celda">
            <img src="{{ $serie->logoPath() }}" alt="Americano Libertad {{ $serie->centroCostoIniciales() }}">
        </td>
        <td class="institucion">
            <p class="colegio-nombre">{{ mb_strtoupper($d->razonSocial) }}</p>
            @if ($d->ruc !== '')
                <p class="colegio-dato">RUC: {{ $d->ruc }}</p>
            @endif
            <p class="colegio-dato">{{ $d->direccionInstitucion }}</p>
            @if ($d->telefonoInstitucion !== '')
                <p class="colegio-dato">Telf.: {{ $d->telefonoInstitucion }}</p>
            @endif
        </td>
        <td class="caja-comprobante">
            @if ($d->ruc !== '')
                <p>RUC {{ $d->ruc }}</p>
            @endif
            <p class="tipo">BOLETA</p>
            <p class="numero">{{ $serie->numeroCompleto($recibo->numero_recibo) }}</p>
        </td>
    </tr>
</table>

<table class="datos">
    <tr>
        <td class="etiqueta">Cliente</td><td class="valor">: {{ $d->cliente }}</td>
        <td class="etiqueta">F. emisión</td><td class="valor">: {{ $d->emitidoEn->format('d/m/Y') }}</td>
    </tr>
    <tr>
        <td class="etiqueta">DNI/RUC</td><td class="valor">: {{ $d->dni }}</td>
        <td class="etiqueta">H. emisión</td><td class="valor">: {{ $d->emitidoEn->format('H:i:s') }}</td>
    </tr>
    <tr>
        <td class="etiqueta">Dirección</td><td class="valor">: {{ $d->direccionCliente }}</td>
        <td class="etiqueta">F. de pago</td><td class="valor">: {{ $d->fechaPago->format('d/m/Y') }}</td>
    </tr>
    <tr>
        <td class="etiqueta">Aula</td><td class="valor">: {{ $d->aula }}</td>
        <td class="etiqueta">F. vencimiento</td><td class="valor">: {{ $d->fechaVencimiento?->format('d/m/Y') ?? '—' }}</td>
    </tr>
</table>

<table class="conceptos">
    <thead>
        <tr>
            <th class="col-cant">Cant.</th>
            <th>Descripción</th>
            <th class="col-monto">P. Unit.</th>
            <th class="col-monto">Desc.</th>
            <th class="col-monto">Otros</th>
            <th class="col-monto">Importe</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="col-cant">1</td>
            <td>{{ $d->descripcion }}</td>
            <td class="col-monto">{{ $soles($d->precioUnitario) }}</td>
            <td class="col-monto">{{ $soles($d->descuento) }}</td>
            <td class="col-monto">{{ $soles($d->otrosCargos) }}</td>
            <td class="col-monto">{{ $soles($d->total) }}</td>
        </tr>
    </tbody>
</table>

<table class="resumen">
    <tr>
        <td class="son-celda">
            <p class="son">SON: {{ $d->montoEnLetras }}</p>
        </td>
        <td class="totales-celda">
            <table class="totales">
                <tr><td>Valor de venta</td><td class="importe">S/ {{ $soles($d->precioUnitario) }}</td></tr>
                <tr><td>Descuento</td><td class="importe">- S/ {{ $soles($d->descuento) }}</td></tr>
                <tr><td>Subtotal</td><td class="importe">S/ {{ $soles($d->precioUnitario - $d->descuento) }}</td></tr>
                <tr><td>Otros cargos</td><td class="importe">+ S/ {{ $soles($d->otrosCargos) }}</td></tr>
                <tr class="total"><td>Total a pagar</td><td class="importe">S/ {{ $soles($d->total) }}</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="adicional">
    <p class="adicional-titulo">Información adicional</p>
    <table class="adicional-tabla">
        <tr>
            <td class="etiqueta">Cuota</td>
            <td>
                @if ($d->cuota)
                    N.° {{ $d->cuota }} ({{ $d->saldoCuota ? 'Parcial' : 'Completo' }})
                    @if ($d->saldoCuota)
                        — Saldo: S/ {{ $soles($d->saldoCuota) }}
                    @endif
                @else
                    —
                @endif
            </td>
        </tr>
        <tr><td class="etiqueta">Origen</td><td>{{ $d->origen ?? '—' }}</td></tr>
        <tr>
            <td class="etiqueta">Método de pago</td>
            <td>
                {{ $d->metodoPago }}
                @foreach ($d->partes as $parte)
                    <br>· {{ $parte['metodo'] }}: S/ {{ $soles($parte['monto']) }}
                @endforeach
            </td>
        </tr>
        <tr><td class="etiqueta">Nro. operación</td><td>{{ $d->numeroOperacion ?? '—' }}</td></tr>
        <tr><td class="etiqueta">Observación</td><td>{{ $d->observacion ?? '—' }}</td></tr>
        <tr><td class="etiqueta">Atendido por</td><td>{{ $d->atendidoPor }}</td></tr>
    </table>
</div>

<p class="gracias">Gracias por su pago</p>

<p class="codigo">Boleta N.° {{ $serie->numeroCompleto($recibo->numero_recibo) }} · emitido el {{ $d->emitidoEn->format('d/m/Y H:i') }}</p>
