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
            ->where('estado', 'confirmado')
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

        $ingresosPorTipoCuota = Pago::query()
            ->join('cuotas', 'cuotas.id', '=', 'pagos.cuota_id')
            ->where('pagos.estado', 'confirmado')
            ->where('pagos.fecha', '>=', $inicioMes)
            ->selectRaw('cuotas.tipo as tipo, SUM(pagos.monto) as total')
            ->groupBy('cuotas.tipo')
            ->pluck('total', 'tipo');

        $ingresosManualesPorCategoria = IngresoManual::where('fecha', '>=', $inicioMes)
            ->selectRaw('categoria, SUM(monto) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $egresosPorCategoria = Egreso::where('fecha', '>=', $inicioMes)
            ->selectRaw('categoria, SUM(monto) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $categoriasMes = [
            'ingresos' => [
                'matricula' => (float) ($ingresosPorTipoCuota['matricula'] ?? 0),
                'pension' => (float) ($ingresosPorTipoCuota['pension'] ?? 0),
                'donacion' => (float) ($ingresosManualesPorCategoria['donacion'] ?? 0),
                'servicio' => (float) ($ingresosManualesPorCategoria['servicio'] ?? 0),
                'otro' => (float) ($ingresosManualesPorCategoria['otro'] ?? 0),
            ],
            'egresos' => [
                'pago_docente' => (float) ($egresosPorCategoria['pago_docente'] ?? 0),
                'operativo' => (float) ($egresosPorCategoria['operativo'] ?? 0),
                'otro' => (float) ($egresosPorCategoria['otro'] ?? 0),
            ],
        ];

        $pagosRecientes = Pago::where('estado', 'confirmado')->with('student')->latest('fecha')->limit(8)->get()
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
                'ingresosHoy' => (float) Pago::where('estado', 'confirmado')->whereDate('fecha', $hoy)->sum('monto')
                    + (float) IngresoManual::whereDate('fecha', $hoy)->sum('monto'),
                'egresosHoy' => (float) Egreso::whereDate('fecha', $hoy)->sum('monto'),
                'ingresosMes' => (float) Pago::where('estado', 'confirmado')->where('fecha', '>=', $inicioMes)->sum('monto')
                    + (float) IngresoManual::where('fecha', '>=', $inicioMes)->sum('monto'),
                'egresosMes' => (float) Egreso::where('fecha', '>=', $inicioMes)->sum('monto'),
            ],
            'resumenMensual' => $resumenMensual,
            'categoriasMes' => $categoriasMes,
            'ultimosIngresos' => $ultimosIngresos,
            'ultimosEgresos' => Egreso::latest('fecha')->limit(8)->get(),
        ]);
    }
}
