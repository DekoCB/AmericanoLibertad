<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Cuota;
use App\Models\Matricula;
use App\Models\Pago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PagoRegistroController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Pago::class);

        $matriculas = Matricula::query()
            ->whereHas('cuotas', fn ($q) => $q->whereIn('estado', ['pendiente', 'parcial', 'vencido']))
            ->with([
                'student:id,first_name,last_name,document_number',
                'carrera:id,name',
                'cuotas' => fn ($q) => $q->whereIn('estado', ['pendiente', 'parcial', 'vencido']),
            ])
            ->get();

        $pendientes = $matriculas
            ->flatMap(function (Matricula $matricula) {
                return $matricula->cuotas->map(function (Cuota $cuota) use ($matricula) {
                    return [
                        'cuota_id' => $cuota->id,
                        'matricula_id' => $matricula->id,
                        'student_id' => $matricula->student_id,
                        'student_name' => trim($matricula->student->first_name.' '.$matricula->student->last_name),
                        'document_number' => $matricula->student->document_number,
                        'carrera_id' => $matricula->carrera_id,
                        'carrera_name' => $matricula->carrera->name ?? 'Sin carrera',
                        'ciclo' => $matricula->ciclo,
                        'concepto_value' => $cuota->tipo === 'matricula'
                            ? 'matricula'
                            : 'pension:'.($cuota->mes ?? ''),
                        'concepto_label' => $cuota->tipo === 'matricula'
                            ? 'Matrícula'
                            : 'Pensión'.($cuota->mes ? " — {$cuota->mes}" : ''),
                        'saldo' => $cuota->saldoRestante(),
                    ];
                });
            })
            ->sortBy('student_name')
            ->values();

        $pagosRecientes = Pago::query()
            ->with(['student:id,first_name,last_name', 'cuota', 'recibo'])
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn (Pago $pago) => [
                'id' => $pago->id,
                'estado' => $pago->estado,
                'fecha' => $pago->fecha->toDateString(),
                'student_name' => $pago->student
                    ? trim($pago->student->first_name.' '.$pago->student->last_name)
                    : 'Estudiante eliminado',
                'monto' => (float) $pago->monto,
                'saldo_restante' => $pago->cuota?->saldoRestante(),
                'comprobante_url' => $pago->recibo
                    ? route('pagos.recibo', $pago->id)
                    : route('pagos.comprobante', $pago->id),
            ]);

        return Inertia::render('Pagos/Index', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name']),
            'pendientes' => $pendientes,
            'pagosRecientes' => $pagosRecientes,
        ]);
    }

    public function storeMasivo(Request $request): RedirectResponse
    {
        $this->authorize('create', Pago::class);

        $validated = $request->validate([
            'pagos' => ['required', 'array', 'min:1'],
            'pagos.*.cuota_id' => ['required', 'integer', 'exists:cuotas,id'],
            'pagos.*.monto' => ['required', 'numeric', 'min:0.01'],
            'medio' => ['required', Rule::in(['efectivo', 'yape', 'plin', 'tarjeta'])],
            'fecha' => ['required', 'date'],
            'nota' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $registrados = 0;
        $omitidos = 0;
        $total = 0.0;

        DB::transaction(function () use ($validated, $user, &$registrados, &$omitidos, &$total) {
            foreach ($validated['pagos'] as $fila) {
                $cuota = Cuota::with('matricula')->lockForUpdate()->find($fila['cuota_id']);
                $monto = (float) $fila['monto'];

                if (! $cuota || $monto > $cuota->saldoRestante()) {
                    $omitidos++;
                    continue;
                }

                Pago::create([
                    'cuota_id' => $cuota->id,
                    'student_id' => $cuota->matricula->student_id,
                    'registrado_por' => $user->id,
                    'monto' => $monto,
                    'medio' => $validated['medio'],
                    'monto_efectivo' => $validated['medio'] === 'efectivo' ? $monto : 0,
                    'monto_yape' => $validated['medio'] === 'yape' ? $monto : 0,
                    'fecha' => $validated['fecha'],
                    'nota' => $validated['nota'] ?? null,
                    'estado' => 'pendiente',
                ]);

                $registrados++;
                $total += $monto;
            }
        });

        if ($registrados === 0) {
            return back()->with('error', 'No se registró ningún pago: los montos ya no coinciden con el saldo pendiente. Actualiza la página e intenta de nuevo.');
        }

        $mensaje = sprintf('Se registraron %d pago%s por S/ %s, pendientes de aprobación.', $registrados, $registrados === 1 ? '' : 's', number_format($total, 2));

        if ($omitidos > 0) {
            $mensaje .= " {$omitidos} fila(s) se omitieron porque el saldo ya no las cubría.";
        }

        return back()->with('success', $mensaje);
    }
}
