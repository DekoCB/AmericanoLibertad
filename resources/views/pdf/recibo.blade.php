<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1B1F27; }
        p { margin: 0; }

        table { border-collapse: collapse; }

        table.encabezado { width: 100%; margin-bottom: 14px; }
        table.encabezado td { vertical-align: middle; }
        .logo-celda { width: 80px; padding-right: 12px; text-align: center; }
        .logo-celda img { width: 74px; }
        .institucion { padding-right: 12px; }
        .colegio-nombre { font-size: 12px; font-weight: bold; color: #12225C; line-height: 1.25; margin-bottom: 3px; }
        .colegio-dato { font-size: 9.5px; color: #5B6472; line-height: 1.35; }
        .caja-comprobante { width: 170px; border: 1.5px solid #12225C; border-radius: 4px; text-align: center; padding: 8px 6px; }
        .caja-comprobante p { font-size: 10px; font-weight: bold; color: #12225C; line-height: 1.5; }
        .caja-comprobante .tipo { font-size: 12px; letter-spacing: 0.04em; }
        .caja-comprobante .numero { font-size: 12px; }

        table.datos { width: 100%; margin-bottom: 14px; border: 1px solid #C7CEDB; }
        table.datos td { padding: 4px 6px; vertical-align: top; }
        table.datos .etiqueta { width: 13%; font-weight: bold; color: #5B6472; white-space: nowrap; }
        table.datos .valor { width: 37%; }

        table.conceptos { width: 100%; margin-bottom: 10px; }
        table.conceptos th { background: #12225C; color: #FFFFFF; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; }
        table.conceptos td { padding: 8px; border-bottom: 1px solid #C7CEDB; }
        table.conceptos .col-cant { width: 7%; text-align: center; }
        table.conceptos .col-monto { width: 11%; text-align: right; white-space: nowrap; }

        table.resumen { width: 100%; margin-bottom: 14px; }
        table.resumen td { vertical-align: top; }
        .son-celda { padding-right: 16px; }
        .son { font-weight: bold; font-size: 10px; border: 1px dashed #C7CEDB; padding: 6px 8px; }
        .totales-celda { width: 42%; }
        table.totales { width: 100%; }
        table.totales td { padding: 3px 6px; }
        table.totales .importe { text-align: right; white-space: nowrap; }
        table.totales tr.total td { font-weight: bold; font-size: 12px; color: #12225C; border-top: 1.5px solid #12225C; padding-top: 5px; }

        .adicional { border: 1px solid #C7CEDB; border-radius: 3px; padding: 8px 10px; margin-bottom: 18px; }
        .adicional-titulo { font-weight: bold; font-size: 10.5px; color: #12225C; margin-bottom: 4px; }
        table.adicional-tabla { width: 100%; }
        table.adicional-tabla td { padding: 2px 0; vertical-align: top; }
        table.adicional-tabla .etiqueta { width: 20%; font-weight: bold; color: #5B6472; }

        .gracias { text-align: center; font-size: 11px; margin-bottom: 24px; }
        .codigo { font-size: 8.5px; color: #8891A0; text-align: center; }
    </style>
</head>
<body>
    @include('pdf.partials.cuerpo-recibo', [
        'serie' => $serie,
        'd' => $detalle ?? \App\Modules\Pagos\Support\DetalleRecibo::desde($pago, $recibo),
    ])
</body>
</html>
