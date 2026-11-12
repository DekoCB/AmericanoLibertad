<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @php
        $angosto = $anchoMm <= 58;
    @endphp
    <style>
        {{--
            dompdf no soporta "auto" como alto de página junto a un ancho
            explícito (ver Css/Style.php::_compute_size() -- solo reconoce la
            propiedad "size" completa siendo literalmente "auto", no como
            segundo token), así que $altoMm viene ya calculado desde
            ReciboService::alturaTicketMm() a partir del contenido real del
            pago -- no es un valor fijo arbitrario.
        --}}
        @page { size: {{ $anchoMm }}mm {{ $altoMm }}mm; margin: 4mm 3mm; }

        body { font-family: 'DejaVu Sans', sans-serif; font-size: {{ $angosto ? '6.5px' : '7.5px' }}; color: #000; width: 100%; line-height: 1.25; }
        p { margin: 0; }

        .centrado { text-align: center; }
        .logo-ticket { width: {{ $angosto ? '22mm' : '28mm' }}; margin: 0 auto 1.5mm; display: block; }
        .encabezado { font-weight: bold; font-size: {{ $angosto ? '6.5px' : '7.5px' }}; }
        .titulo-comprobante { font-weight: bold; font-size: {{ $angosto ? '8.5px' : '10px' }}; }

        hr.regla-solida { border: none; border-top: 0.6px solid #000; margin: 1.5mm 0; }

        table { width: 100%; border-collapse: collapse; }

        table.datos { margin: 0.8mm 0; }
        table.datos td { padding: 0.2mm 0; vertical-align: top; }
        table.datos .etiqueta { width: {{ $angosto ? '33%' : '30%' }}; white-space: nowrap; }
        table.datos .dos-puntos { width: 3%; }

        table.items th { font-size: {{ $angosto ? '5.5px' : '6.5px' }}; font-weight: bold; border-bottom: 0.6px dashed #000; padding: 0 0 0.6mm; }
        table.items td { padding: 0.8mm 0 0; vertical-align: top; font-size: {{ $angosto ? '5.5px' : '6.5px' }}; }
        table.items .c-cant { width: 8%; text-align: left; }
        table.items .c-desc { text-align: left; }
        table.items .c-num { width: {{ $angosto ? '14%' : '13%' }}; text-align: right; }

        table.totales td { padding: 0.3mm 0; }
        table.totales .importe { text-align: right; width: 40%; }
        table.totales tr.total td { font-weight: bold; border-top: 0.6px dashed #000; padding-top: 0.8mm; }

        .son { font-weight: bold; margin-top: 1.5mm; }

        .adicional { margin-top: 1mm; }
        .adicional p { margin-bottom: 0.3mm; }
        .adicional-titulo { font-weight: bold; font-size: {{ $angosto ? '7px' : '8px' }}; margin-bottom: 0.8mm !important; }
        .adicional .parte { padding-left: 2mm; }

        .gracias { margin-top: 3mm; text-align: center; }
    </style>
</head>
<body>
    @include('pdf.partials.cuerpo-recibo-ticket', [
        'serie' => $serie,
        'anchoMm' => $anchoMm,
        'd' => $detalle ?? \App\Modules\Pagos\Support\DetalleRecibo::desde($pago, $recibo),
    ])
</body>
</html>
