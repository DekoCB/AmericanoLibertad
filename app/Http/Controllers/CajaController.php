<?php

namespace App\Http\Controllers;

use App\Models\Egreso;
use App\Models\IngresoManual;
use App\Models\Pago;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CajaController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Egreso::class);

        $mesExpr = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', fecha)"
            : "DATE_FORMAT(fecha, '%Y-%m')";

        $pagosPorMes = Pago::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $ingresosManualesPorMes = IngresoManual::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $egresosPorMes = Egreso::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $meses = $pagosPorMes->keys()
            ->merge($ingresosManualesPorMes->keys())
            ->merge($egresosPorMes->keys())
            ->unique()
            ->sortDesc()
            ->values();

        $resumenMensual = $meses->map(fn ($mes) => [
            'mes' => $mes,
            'ingresos' => (float) ($pagosPorMes[$mes]->total ?? 0) + (float) ($ingresosManualesPorMes[$mes]->total ?? 0),
            'egresos' => (float) ($egresosPorMes[$mes]->total ?? 0),
        ]);

        $hoy = now()->toDateString();
        $inicioMes = now()->startOfMonth()->toDateString();

        $pagosRecientes = Pago::with('student')->latest('fecha')->limit(8)->get()
            ->map(fn (Pago $pago) => [
                'tipo' => 'pago',
                'id' => $pago->id,
                'fecha' => $pago->fecha,
                'descripcion' => $pago->student
                    ? "{$pago->student->first_name} {$pago->student->last_name}"
                    : 'Matrícula',
                'monto' => (float) $pago->monto,
            ]);

        $ingresosManualesRecientes = IngresoManual::latest('fecha')->limit(8)->get()
            ->map(fn (IngresoManual $ingreso) => [
                'tipo' => 'manual',
                'id' => $ingreso->id,
                'fecha' => $ingreso->fecha,
                'descripcion' => $ingreso->concepto,
                'monto' => (float) $ingreso->monto,
            ]);

        $ultimosIngresos = $pagosRecientes->concat($ingresosManualesRecientes)
            ->sortByDesc('fecha')
            ->take(8)
            ->values();

        return Inertia::render('Caja/Index', [
            'stats' => [
                'ingresosHoy' => (float) Pago::whereDate('fecha', $hoy)->sum('monto')
                    + (float) IngresoManual::whereDate('fecha', $hoy)->sum('monto'),
                'egresosHoy' => (float) Egreso::whereDate('fecha', $hoy)->sum('monto'),
                'ingresosMes' => (float) Pago::where('fecha', '>=', $inicioMes)->sum('monto')
                    + (float) IngresoManual::where('fecha', '>=', $inicioMes)->sum('monto'),
                'egresosMes' => (float) Egreso::where('fecha', '>=', $inicioMes)->sum('monto'),
            ],
            'resumenMensual' => $resumenMensual,
            'ultimosIngresos' => $ultimosIngresos,
            'ultimosEgresos' => Egreso::latest('fecha')->limit(8)->get(),
        ]);
    }
}
