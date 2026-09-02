<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Libreta de notas — {{ $course->name }}</title>
    <style>
        * { box-sizing: border-box; }

        body {
            font-family: 'Helvetica', Arial, sans-serif;
            color: #1a1a1a;
            margin: 0;
            padding: 16px;
            font-size: 10px;
        }

        h1 {
            text-align: center;
            font-size: 15px;
            text-transform: uppercase;
            margin: 0 0 4px;
        }

        h2 {
            text-align: center;
            font-size: 11px;
            font-weight: normal;
            color: #444;
            margin: 0 0 14px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #999;
            padding: 4px 5px;
            text-align: center;
        }

        thead th {
            background: #e5e7eb;
            font-weight: bold;
        }

        td.nombre {
            text-align: left;
            font-weight: bold;
            white-space: nowrap;
        }

        td.numero {
            width: 24px;
        }

        td.prom-final {
            font-weight: bold;
            background: #f3f4f6;
        }

        td.vacio {
            color: #999;
        }
    </style>
</head>
<body>
    <h1>Libreta de notas</h1>
    <h2>{{ $course->subject?->name }} — {{ $course->name }}</h2>

    <table>
        <thead>
            <tr>
                <th rowspan="2" class="numero">#</th>
                <th rowspan="2">Estudiante</th>
                <th rowspan="2">Prom. final</th>
                @foreach ($libreta['grupos'] as $grupo)
                    <th colspan="{{ max(1, count($grupo['evaluaciones'])) + 1 }}">
                        {{ mb_strtoupper($grupo['nombre']) }} ({{ number_format($grupo['peso'], 2) }}%)
                    </th>
                @endforeach
            </tr>
            <tr>
                @foreach ($libreta['grupos'] as $grupo)
                    @forelse ($grupo['evaluaciones'] as $evaluacion)
                        <th>{{ $evaluacion['label'] }}</th>
                    @empty
                        <th>—</th>
                    @endforelse
                    <th>Prom</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($libreta['filas'] as $index => $fila)
                <tr>
                    <td class="numero">{{ $index + 1 }}</td>
                    <td class="nombre">{{ $fila['nombre'] }}</td>
                    <td class="prom-final">{{ $fila['promedioFinal'] ?? '—' }}</td>
                    @foreach ($libreta['grupos'] as $grupo)
                        @forelse ($grupo['evaluaciones'] as $evaluacion)
                            <td class="{{ ($fila['notas'][$evaluacion['id']] ?? null) === null ? 'vacio' : '' }}">
                                {{ $fila['notas'][$evaluacion['id']] ?? '—' }}
                            </td>
                        @empty
                            <td class="vacio">—</td>
                        @endforelse
                        <td>{{ $fila['promediosPorGrupo'][$grupo['id']] ?? '—' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ 3 + $libreta['grupos']->sum(fn ($g) => max(1, count($g['evaluaciones'])) + 1) }}">
                        Esta sección no tiene estudiantes matriculados.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
