<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Cuota;
use App\Models\Egreso;
use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReporteController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Egreso::class);

        $carreraId = $request->integer('carrera_id') ?: null;
        $ciclo = $request->integer('ciclo') ?: null;
        $deudoresPage = (int) $request->input('deudores_page', 1);

        return Inertia::render('Reportes/Index', [
            'ingresosPorPeriodo' => $this->ingresosPorPeriodo(),
            'moraPorCarrera' => $this->moraPorCarrera(),
            'proyeccionCobranza' => $this->proyeccionCobranza(),
            'deudores' => $this->deudores($carreraId, $ciclo, $deudoresPage),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
            'filters' => [
                'carrera_id' => $carreraId,
                'ciclo' => $ciclo,
            ],
        ]);
    }

    public function exportar(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Egreso::class);

        $carreraId = $request->integer('carrera_id') ?: null;
        $ciclo = $request->integer('ciclo') ?: null;

        $spreadsheet = new Spreadsheet();

        $this->llenarHojaIngresos($spreadsheet->getActiveSheet(), $this->ingresosPorPeriodo());
        $this->llenarHojaMora($spreadsheet->createSheet(), $this->moraPorCarrera());
        $this->llenarHojaProyeccion($spreadsheet->createSheet(), $this->proyeccionCobranza());
        $this->llenarHojaDeudores($spreadsheet->createSheet(), $this->deudoresTodos($carreraId, $ciclo));
        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);
        $filename = 'reportes-financieros-'.now()->format('Y-m-d').'.xlsx';

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function ingresosPorPeriodo(): array
    {
        return Pago::query()
            ->where('estado', 'confirmado')
            ->selectRaw("DATE_FORMAT(fecha, '%Y-%m') as periodo, COUNT(*) as cantidad, SUM(monto) as total")
            ->groupBy('periodo')
            ->orderByDesc('periodo')
            ->limit(12)
            ->get()
            ->map(fn ($fila) => [
                'periodo' => $fila->periodo,
                'cantidad' => (int) $fila->cantidad,
                'total' => (float) $fila->total,
            ])
            ->all();
    }

    private function moraPorCarrera(): array
    {
        return Carrera::query()
            ->leftJoin('matriculas', 'matriculas.carrera_id', '=', 'carreras.id')
            ->leftJoin('cuotas', function ($join) {
                $join->on('cuotas.matricula_id', '=', 'matriculas.id')
                    ->where('cuotas.estado', '=', 'vencido');
            })
            ->groupBy('carreras.id', 'carreras.name')
            ->orderByDesc(DB::raw('SUM(cuotas.monto_programado - cuotas.monto_pagado)'))
            ->get([
                'carreras.id',
                'carreras.name as carrera',
                DB::raw('COUNT(cuotas.id) as cuotas_vencidas'),
                DB::raw('COALESCE(SUM(cuotas.monto_programado - cuotas.monto_pagado), 0) as monto_vencido'),
            ])
            ->map(fn ($fila) => [
                'carrera' => $fila->carrera,
                'cuotas_vencidas' => (int) $fila->cuotas_vencidas,
                'monto_vencido' => (float) $fila->monto_vencido,
            ])
            ->all();
    }

    private function proyeccionCobranza(): array
    {
        return Cuota::query()
            ->whereIn('estado', ['pendiente', 'parcial'])
            ->selectRaw("DATE_FORMAT(fecha_vencimiento, '%Y-%m') as periodo, COUNT(*) as cuotas, SUM(monto_programado - monto_pagado) as monto_esperado")
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get()
            ->map(fn ($fila) => [
                'periodo' => $fila->periodo,
                'cuotas' => (int) $fila->cuotas,
                'monto_esperado' => (float) $fila->monto_esperado,
            ])
            ->all();
    }

    private function deudoresQuery(?int $carreraId, ?int $ciclo): \Illuminate\Database\Query\Builder
    {
        return DB::table('cuotas')
            ->join('matriculas', 'matriculas.id', '=', 'cuotas.matricula_id')
            ->join('students', 'students.id', '=', 'matriculas.student_id')
            ->join('carreras', 'carreras.id', '=', 'matriculas.carrera_id')
            ->whereIn('cuotas.estado', ['pendiente', 'parcial', 'vencido'])
            ->when($carreraId, fn ($q) => $q->where('matriculas.carrera_id', $carreraId))
            ->when($ciclo, fn ($q) => $q->where('matriculas.ciclo', $ciclo))
            ->selectRaw(
                'students.id as student_id, students.first_name, students.last_name, students.document_number, '
                . 'carreras.name as carrera_name, matriculas.ciclo as ciclo, '
                . 'SUM(cuotas.monto_programado - cuotas.monto_pagado) as deuda, '
                . 'COUNT(cuotas.id) as cuotas_pendientes, '
                . 'MIN(cuotas.fecha_vencimiento) as vencimiento_mas_antiguo'
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name', 'students.document_number', 'carreras.name', 'matriculas.ciclo')
            ->orderByDesc('deuda');
    }

    private function deudores(?int $carreraId, ?int $ciclo, int $page): LengthAwarePaginator
    {
        return $this->deudoresQuery($carreraId, $ciclo)
            ->paginate(10, ['*'], 'deudores_page', $page)
            ->through(fn ($fila) => [
                'student_id' => (int) $fila->student_id,
                'first_name' => $fila->first_name,
                'last_name' => $fila->last_name,
                'document_number' => $fila->document_number,
                'carrera_name' => $fila->carrera_name,
                'ciclo' => (int) $fila->ciclo,
                'deuda' => round((float) $fila->deuda, 2),
                'cuotas_pendientes' => (int) $fila->cuotas_pendientes,
                'vencimiento_mas_antiguo' => $fila->vencimiento_mas_antiguo,
            ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function deudoresTodos(?int $carreraId, ?int $ciclo): array
    {
        return $this->deudoresQuery($carreraId, $ciclo)->get()->map(fn ($fila) => [
            'first_name' => $fila->first_name,
            'last_name' => $fila->last_name,
            'document_number' => $fila->document_number,
            'carrera_name' => $fila->carrera_name,
            'ciclo' => (int) $fila->ciclo,
            'deuda' => round((float) $fila->deuda, 2),
            'cuotas_pendientes' => (int) $fila->cuotas_pendientes,
            'vencimiento_mas_antiguo' => $fila->vencimiento_mas_antiguo,
        ])->all();
    }

    private function estiloHoja(Worksheet $sheet, string $titulo, array $encabezados): void
    {
        $ultimaColumna = chr(ord('A') + count($encabezados) - 1);

        $sheet->setCellValue('A1', $titulo);
        $sheet->mergeCells("A1:{$ultimaColumna}1");
        $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $columna = 'A';
        foreach ($encabezados as $encabezado) {
            $sheet->setCellValue("{$columna}3", $encabezado);
            $columna++;
        }
        $sheet->getStyle("A3:{$ultimaColumna}3")->getFont()->setBold(true);
        $sheet->getStyle("A3:{$ultimaColumna}3")->getFill()
            ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E5E7EB');

        foreach (range('A', $ultimaColumna) as $letra) {
            $sheet->getColumnDimension($letra)->setWidth(24);
        }
    }

    private function llenarHojaIngresos(Worksheet $sheet, array $filas): void
    {
        $sheet->setTitle('Ingresos por periodo');
        $this->estiloHoja($sheet, 'INGRESOS POR PERIODO', ['Periodo', 'Cantidad de pagos', 'Total (S/)']);

        $fila = 4;
        foreach ($filas as $registro) {
            $sheet->setCellValue("A{$fila}", $registro['periodo']);
            $sheet->setCellValue("B{$fila}", $registro['cantidad']);
            $sheet->setCellValue("C{$fila}", $registro['total']);
            $fila++;
        }

        $this->bordear($sheet, $fila - 1, 3);
    }

    private function llenarHojaMora(Worksheet $sheet, array $filas): void
    {
        $sheet->setTitle('Mora por carrera');
        $this->estiloHoja($sheet, 'MORA POR CARRERA', ['Carrera', 'Cuotas vencidas', 'Monto vencido (S/)']);

        $fila = 4;
        foreach ($filas as $registro) {
            $sheet->setCellValue("A{$fila}", $registro['carrera']);
            $sheet->setCellValue("B{$fila}", $registro['cuotas_vencidas']);
            $sheet->setCellValue("C{$fila}", $registro['monto_vencido']);
            $fila++;
        }

        $this->bordear($sheet, $fila - 1, 3);
    }

    private function llenarHojaProyeccion(Worksheet $sheet, array $filas): void
    {
        $sheet->setTitle('Proyeccion de cobranza');
        $this->estiloHoja($sheet, 'PROYECCIÓN DE COBRANZA', ['Periodo (vencimiento)', 'Cuotas pendientes', 'Monto esperado (S/)']);

        $fila = 4;
        foreach ($filas as $registro) {
            $sheet->setCellValue("A{$fila}", $registro['periodo']);
            $sheet->setCellValue("B{$fila}", $registro['cuotas']);
            $sheet->setCellValue("C{$fila}", $registro['monto_esperado']);
            $fila++;
        }

        $this->bordear($sheet, $fila - 1, 3);
    }

    private function llenarHojaDeudores(Worksheet $sheet, array $filas): void
    {
        $sheet->setTitle('Deudores');
        $this->estiloHoja($sheet, 'DEUDORES', ['Estudiante', 'DNI', 'Carrera', 'Ciclo', 'Cuotas pendientes', 'Deuda (S/)', 'Vencimiento más antiguo']);

        $fila = 4;
        foreach ($filas as $registro) {
            $sheet->setCellValue("A{$fila}", trim($registro['first_name'].' '.$registro['last_name']));
            $sheet->setCellValue("B{$fila}", $registro['document_number']);
            $sheet->setCellValue("C{$fila}", $registro['carrera_name']);
            $sheet->setCellValue("D{$fila}", $registro['ciclo']);
            $sheet->setCellValue("E{$fila}", $registro['cuotas_pendientes']);
            $sheet->setCellValue("F{$fila}", $registro['deuda']);
            $sheet->setCellValue("G{$fila}", $registro['vencimiento_mas_antiguo']);
            $fila++;
        }

        $this->bordear($sheet, $fila - 1, 7);
    }

    private function bordear(Worksheet $sheet, int $ultimaFila, int $columnas): void
    {
        $ultimaColumna = chr(ord('A') + $columnas - 1);
        $sheet->getStyle("A3:{$ultimaColumna}{$ultimaFila}")
            ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
    }
}
