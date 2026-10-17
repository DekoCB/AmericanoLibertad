<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
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

        body { font-family: 'Helvetica', sans-serif; font-size: {{ $anchoMm <= 58 ? '8.5px' : '9.5px' }}; color: #1B1F27; width: 100%; }

        .centrado { text-align: center; }
        .logo-ticket { width: {{ $anchoMm <= 58 ? '28mm' : '38mm' }}; margin: 0 auto 2mm; display: block; }
        .nombre-colegio { font-size: {{ $anchoMm <= 58 ? '10px' : '11.5px' }}; font-weight: bold; margin: 0; line-height: 1.2; }
        .subtitulo { font-size: {{ $anchoMm <= 58 ? '7px' : '8px' }}; color: #5B6472; margin: 1mm 0 0; }

        hr.regla-ticket { border: none; border-top: 1px dashed #5B6472; margin: 2mm 0; }

        table.linea { width: 100%; border-collapse: collapse; margin-bottom: 1mm; }
        table.linea td { padding: 0.5mm 0; vertical-align: top; }
        table.linea .etiqueta { width: 42%; color: #5B6472; font-size: {{ $anchoMm <= 58 ? '7px' : '7.5px' }}; text-transform: uppercase; }
        table.linea .valor { font-weight: bold; text-align: right; }

        .seccion { margin: 2mm 0; }
        .seccion-titulo { font-size: {{ $anchoMm <= 58 ? '7px' : '7.5px' }}; text-transform: uppercase; color: #5B6472; border-bottom: 1px dashed #C7CEDB; padding-bottom: 1mm; margin-bottom: 1mm; }

        .monto-total { text-align: right; font-size: {{ $anchoMm <= 58 ? '11px' : '13px' }}; font-weight: bold; margin-top: 1mm; }

        .pie-ticket { margin-top: 3mm; font-size: {{ $anchoMm <= 58 ? '6.5px' : '7px' }}; color: #8891A0; text-align: center; }
    </style>
</head>
<body>
    @include('pdf.partials.cuerpo-recibo-ticket', ['serie' => $serie, 'anchoMm' => $anchoMm])
</body>
</html>
