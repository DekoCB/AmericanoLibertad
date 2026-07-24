<?php

namespace App\Http\Controllers;

use App\Models\Egreso;
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

        $ingresosPorMes = Pago::query()
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

        $meses = $ingresosPorMes->keys()->merge($egresosPorMes->keys())->unique()->sortDesc()->values();

        $resumenMensual = $meses->map(fn ($mes) => [
            'mes' => $mes,
            'ingresos' => (float) ($ingresosPorMes[$mes]->total ?? 0),
            'egresos' => (float) ($egresosPorMes[$mes]->total ?? 0),
        ]);

        $hoy = now()->toDateString();
        $inicioMes = now()->startOfMonth()->toDateString();

        return Inertia::render('Caja/Index', [
            'stats' => [
                'ingresosHoy' => (float) Pago::whereDate('fecha', $hoy)->sum('monto'),
                'egresosHoy' => (float) Egreso::whereDate('fecha', $hoy)->sum('monto'),
                'ingresosMes' => (float) Pago::where('fecha', '>=', $inicioMes)->sum('monto'),
                'egresosMes' => (float) Egreso::where('fecha', '>=', $inicioMes)->sum('monto'),
            ],
            'resumenMensual' => $resumenMensual,
            'ultimosIngresos' => Pago::with('student')->latest('fecha')->limit(8)->get(),
            'ultimosEgresos' => Egreso::latest('fecha')->limit(8)->get(),
        ]);
    }
}
