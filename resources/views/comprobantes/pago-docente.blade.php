<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $numeroBoleta }} — {{ $teacher->first_name }} {{ $teacher->last_name }}</title>
    <style>
        :root {
            --ink: #1a1a1a;
            --muted: #444;
            --border: #cfcfcf;
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: var(--ink);
            margin: 0;
            padding: 24px;
            background: #e9e9e9;
        }

        .sheet {
            max-width: 460px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid var(--border);
            padding: 24px 20px;
            font-size: 13px;
        }

        .logo {
            display: block;
            width: 78px;
            height: 78px;
            margin: 0 auto 12px;
            border-radius: 50%;
            object-fit: cover;
        }

        .cabecera {
            text-align: center;
            font-weight: 700;
            text-transform: uppercase;
            line-height: 1.5;
            margin-bottom: 14px;
        }

        .cabecera .razon {
            font-size: 13px;
        }

        .cabecera .detalle {
            font-weight: 400;
            font-size: 12px;
        }

        hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 14px 0;
        }

        hr.punteada {
            border-top: 1px dashed var(--border);
        }

        .titulo {
            text-align: center;
            font-weight: 700;
            font-size: 15px;
            letter-spacing: 0.04em;
        }

        .titulo .numero {
            font-size: 14px;
            margin-top: 2px;
        }

        .fila {
            display: flex;
            gap: 8px;
            margin-bottom: 4px;
        }

        .fila .etiqueta {
            flex: 0 0 118px;
            font-weight: 700;
        }

        .fila .valor {
            flex: 1;
            overflow-wrap: break-word;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        thead th {
            text-align: left;
            font-weight: 700;
            border-bottom: 1px solid var(--ink);
            padding: 4px 2px;
        }

        thead th.num, tbody td.num {
            text-align: right;
        }

        tbody td {
            padding: 5px 2px;
            border-bottom: 1px solid var(--border);
            overflow-wrap: break-word;
        }

        .totales {
            font-size: 13px;
        }

        .totales .fila-total {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }

        .totales .fila-total.final {
            font-weight: 700;
            font-size: 14px;
            border-top: 1px dashed var(--border);
            padding-top: 6px;
            margin-top: 4px;
        }

        .son {
            font-weight: 700;
            margin-top: 6px;
        }

        .detalles p {
            margin: 0;
        }

        .info-adicional p {
            margin: 2px 0;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
        }

        .no-print {
            max-width: 460px;
            margin: 0 auto 16px;
            text-align: right;
        }

        .no-print button {
            font-family: inherit;
            font-size: 13px;
            padding: 8px 18px;
            border-radius: 8px;
            border: none;
            background: #1c2b4a;
            color: #fff;
            cursor: pointer;
        }

        @media print {
            @page {
                size: auto;
                margin: 0;
            }

            body {
                padding: 0;
                margin: 0;
                background: #fff;
            }

            .sheet {
                border: none;
                max-width: 100%;
                width: 100%;
                padding: 3mm 4mm;
            }

            .fila .etiqueta {
                flex-basis: 34vw;
            }

            table {
                font-size: 10px;
            }

            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()">Imprimir / Guardar como PDF</button>
    </div>

    <div class="sheet">
        <img class="logo" src="{{ asset('images/Logo.png') }}" alt="Logo">

        <div class="cabecera">
            <div class="razon">Instituto Educativo Superior Americano Libertad</div>
            <div class="detalle">RUC: 10456641194</div>
            <div class="detalle">AV. ESPAÑA S/N TRUJILLO</div>
        </div>

        <hr>

        <div class="titulo">
            <div>BOLETA</div>
            <div class="numero">{{ $numeroBoleta }}</div>
        </div>

        <hr>

        <div class="fila">
            <span class="etiqueta">F. EMISIÓN</span>
            <span class="valor">: {{ $egreso->fecha->format('d-m-Y') }}</span>
        </div>
        <div class="fila">
            <span class="etiqueta">H. EMISIÓN</span>
            <span class="valor">: {{ $egreso->created_at->format('H:i:s') }}</span>
        </div>
        <div class="fila">
            <span class="etiqueta">DOCENTE</span>
            <span class="valor">: {{ mb_strtoupper($teacher->first_name . ' ' . $teacher->last_name) }}</span>
        </div>
        <div class="fila">
            <span class="etiqueta">CORREO</span>
            <span class="valor">: {{ $teacher->email ?: '-' }}</span>
        </div>
        <div class="fila">
            <span class="etiqueta">TARIFA/HORA</span>
            <span class="valor">: S/ {{ number_format($teacher->tarifa_hora, 2) }}</span>
        </div>
        <div class="fila">
            <span class="etiqueta">PERIODO PAGADO</span>
            <span class="valor">: {{ $desde }} — {{ $hasta }}</span>
        </div>

        <hr>

        <table>
            <thead>
                <tr>
                    <th>CANT</th>
                    <th>DESCRIPCIÓN</th>
                    <th class="num">P.UNIT</th>
                    <th class="num">DESC.</th>
                    <th class="num">OTROS</th>
                    <th class="num">IMPORTE</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($filas as $fila)
                    <tr>
                        <td>{{ $fila['horas'] }}</td>
                        <td>{{ $fila['fecha'] }} — {{ mb_strtoupper($fila['curso'] ?? '-') }}</td>
                        <td class="num">{{ number_format($fila['monto_bruto'], 2) }}</td>
                        <td class="num">{{ number_format($fila['descuento_tardanza'], 2) }}</td>
                        <td class="num">0.00</td>
                        <td class="num">{{ number_format($fila['monto_neto'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <hr class="punteada">

        <div class="totales">
            <div class="fila-total">
                <span>VALOR DE VENTA</span>
                <span>S/ {{ number_format($totalBruto, 2) }}</span>
            </div>
            <div class="fila-total">
                <span>DESCUENTO</span>
                <span>- S/ {{ number_format($totalDescuento, 2) }}</span>
            </div>
            <div class="fila-total">
                <span>SUBTOTAL</span>
                <span>S/ {{ number_format($totalBruto - $totalDescuento, 2) }}</span>
            </div>
            <div class="fila-total">
                <span>OTROS CARGOS</span>
                <span>+ S/ 0.00</span>
            </div>
            <div class="fila-total final">
                <span>TOTAL A PAGAR</span>
                <span>S/ {{ number_format($totalNeto, 2) }}</span>
            </div>
        </div>

        <div class="son">SON: {{ $montoEnLetras }}</div>

        <hr>

        <div class="detalles">
            <p><strong>Detalles:</strong> Pago realizado al docente <em>{{ $teacher->first_name }} {{ $teacher->last_name }}</em> por {{ $totalHoras }} horas académicas dictadas.</p>
        </div>

        <hr>

        <div class="info-adicional">
            <p><strong>Información adicional</strong></p>
            <p><strong>Vendedor:</strong> {{ $egreso->registradoPor?->name ?? '-' }}</p>
        </div>

        <p class="footer">Gracias por su servicio</p>
    </div>
</body>
</html>
