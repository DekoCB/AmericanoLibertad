<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Comprobante de pago #{{ $egreso->id }} — {{ $teacher->first_name }} {{ $teacher->last_name }}</title>
    <style>
        :root {
            --navy: #1c2b4a;
            --ink: #1f2430;
            --muted: #667085;
            --border: #d8dce3;
            --cream: #f7f5f0;
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: var(--ink);
            margin: 0;
            padding: 40px;
            background: var(--cream);
        }

        .sheet {
            max-width: 780px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 40px 48px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 3px solid var(--navy);
            padding-bottom: 20px;
            margin-bottom: 24px;
        }

        .header img {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
        }

        .header h1 {
            margin: 0;
            font-size: 18px;
            color: var(--navy);
            letter-spacing: 0.02em;
        }

        .header p {
            margin: 2px 0 0;
            font-size: 12px;
            color: var(--muted);
        }

        .titulo {
            text-align: center;
            margin: 8px 0 28px;
        }

        .titulo h2 {
            margin: 0;
            font-size: 15px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--ink);
        }

        .titulo span {
            font-size: 12px;
            color: var(--muted);
        }

        .datos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            font-size: 13px;
            margin-bottom: 28px;
        }

        .datos dt {
            color: var(--muted);
        }

        .datos dd {
            margin: 0 0 8px;
            font-weight: 600;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 8px;
        }

        thead th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #fff;
            background: var(--navy);
            padding: 8px 10px;
        }

        thead th.num, tbody td.num, tfoot td.num {
            text-align: right;
        }

        tbody td {
            padding: 7px 10px;
            border-bottom: 1px solid var(--border);
        }

        tfoot td {
            padding: 10px;
            font-weight: 700;
            border-top: 2px solid var(--navy);
        }

        .firmas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 64px;
            text-align: center;
            font-size: 12px;
        }

        .firmas div {
            border-top: 1px solid var(--ink);
            padding-top: 6px;
        }

        .footer {
            margin-top: 32px;
            font-size: 11px;
            color: var(--muted);
            text-align: center;
        }

        .no-print {
            max-width: 780px;
            margin: 0 auto 16px;
            text-align: right;
        }

        .no-print button {
            font-family: inherit;
            font-size: 13px;
            padding: 8px 18px;
            border-radius: 8px;
            border: none;
            background: var(--navy);
            color: #fff;
            cursor: pointer;
        }

        @media print {
            body { padding: 0; background: #fff; }
            .sheet { border: none; border-radius: 0; max-width: none; padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()">Imprimir / Guardar como PDF</button>
    </div>

    <div class="sheet">
        <div class="header">
            <img src="{{ asset('images/Logo.png') }}" alt="Logo">
            <div>
                <h1>{{ config('app.name') }}</h1>
                <p>Comprobante interno de pago a personal docente</p>
            </div>
        </div>

        <div class="titulo">
            <h2>Comprobante de pago a docente</h2>
            <span>N.° {{ str_pad($egreso->id, 6, '0', STR_PAD_LEFT) }} · Emitido el {{ $egreso->fecha->format('d/m/Y') }}</span>
        </div>

        <dl class="datos">
            <div>
                <dt>Docente</dt>
                <dd>{{ $teacher->first_name }} {{ $teacher->last_name }}</dd>
            </div>
            <div>
                <dt>Periodo pagado</dt>
                <dd>{{ $desde }} — {{ $hasta }}</dd>
            </div>
            <div>
                <dt>Correo</dt>
                <dd>{{ $teacher->email ?? '—' }}</dd>
            </div>
            <div>
                <dt>Tarifa por hora académica</dt>
                <dd>S/ {{ number_format($teacher->tarifa_hora, 2) }}</dd>
            </div>
        </dl>

        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th class="num">Horas</th>
                    <th class="num">Bruto</th>
                    <th class="num">Descuento</th>
                    <th class="num">Neto</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($filas as $fila)
                    <tr>
                        <td>{{ $fila['fecha'] }}</td>
                        <td>{{ $fila['curso'] ?? '—' }}</td>
                        <td class="num">{{ $fila['horas'] }}</td>
                        <td class="num">S/ {{ number_format($fila['monto_bruto'], 2) }}</td>
                        <td class="num">S/ {{ number_format($fila['descuento_tardanza'], 2) }}</td>
                        <td class="num">S/ {{ number_format($fila['monto_neto'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2">Total</td>
                    <td class="num">{{ $totalHoras }}</td>
                    <td class="num">S/ {{ number_format($totalBruto, 2) }}</td>
                    <td class="num">S/ {{ number_format($totalDescuento, 2) }}</td>
                    <td class="num">S/ {{ number_format($totalNeto, 2) }}</td>
                </tr>
            </tfoot>
        </table>

        <div class="firmas">
            <div>Firma del docente</div>
            <div>Firma de administración</div>
        </div>

        <p class="footer">
            {{ config('app.name') }} · Documento generado el {{ now()->format('d/m/Y H:i') }}
        </p>
    </div>
</body>
</html>
