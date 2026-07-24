<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Cuota;
use App\Models\Egreso;
use App\Models\Pago;
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
    public function index(): Response
    {
        $this->authorize('viewAny', Egreso::class);

        return Inertia::render('Reportes/Index', [
            'ingresosPorPeriodo' => $this->ingresosPorPeriodo(),
            'moraPorCarrera' => $this->moraPorCarrera(),
            'proyeccionCobranza' => $this->proyeccionCobranza(),
        ]);
    }

    public function exportar(): StreamedResponse
    {
        $this->authorize('viewAny', Egreso::class);

        $spreadsheet = new Spreadsheet();

        $this->llenarHojaIngresos($spreadsheet->getActiveSheet(), $this->ingresosPorPeriodo());
        $this->llenarHojaMora($spreadsheet->createSheet(), $this->moraPorCarrera());
        $this->llenarHojaProyeccion($spreadsheet->createSheet(), $this->proyeccionCobranza());
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

    private function bordear(Worksheet $sheet, int $ultimaFila, int $columnas): void
    {
        $ultimaColumna = chr(ord('A') + $columnas - 1);
        $sheet->getStyle("A3:{$ultimaColumna}{$ultimaFila}")
            ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
    }
}
