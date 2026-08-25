<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Cuota;
use App\Models\IngresoManual;
use App\Models\Pago;
use App\Support\NumeroALetras;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PagoController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Pago::class);

        $pagos = Pago::query()
            ->with(['student', 'cuota.matricula'])
            ->when($request->string('concepto')->toString(), function ($query, $concepto) {
                $query->whereHas('cuota', function ($q) use ($concepto) {
                    if ($concepto === 'matricula') {
                        $q->where('tipo', 'matricula');
                        return;
                    }

                    $mes = str_starts_with($concepto, 'pension:') ? substr($concepto, 8) : '';
                    $q->where('tipo', 'pension')->where('mes', $mes === '' ? null : $mes);
                });
            })
            ->latest('fecha')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Ingresos/Index', [
            'pagos' => $pagos,
            'conceptos' => $this->conceptosDisponibles(),
            'filters' => $request->only(['concepto']),
            'pagosDeclaradosPendientes' => Pago::where('estado', 'declarado')
                ->with('student')
                ->orderBy('fecha_limite_pago')
                ->get(),
            'can' => [
                'createIngresoManual' => $request->user()->can('create', IngresoManual::class),
                'confirmarPagos' => $request->user()->can('create', Pago::class),
            ],
        ]);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function conceptosDisponibles(): array
    {
        return Cuota::query()
            ->whereHas('pagos')
            ->select('tipo', 'mes')
            ->distinct()
            ->orderBy('tipo')
            ->orderBy('mes')
            ->get()
            ->map(function (Cuota $cuota) {
                if ($cuota->tipo === 'matricula') {
                    return ['value' => 'matricula', 'label' => 'Matrícula'];
                }

                return [
                    'value' => 'pension:' . ($cuota->mes ?? ''),
                    'label' => 'Pensión' . ($cuota->mes ? " — {$cuota->mes}" : ''),
                ];
            })
            ->unique('value')
            ->values()
            ->all();
    }

    public function store(Request $request, Cuota $cuota): RedirectResponse
    {
        $this->authorize('create', [Pago::class, $cuota]);

        $user = $request->user();
        $esEstudiante = $user->hasRole(UserRole::Estudiante);

        $validated = $request->validate([
            'monto' => ['required', 'numeric', 'min:0.01', 'max:' . $cuota->saldoRestante()],
            'medio' => ['required', Rule::in(['efectivo', 'yape', 'plin', 'tarjeta'])],
            'monto_efectivo' => ['required_if:medio,efectivo', 'nullable', 'numeric', 'min:0'],
            'monto_yape' => ['required_if:medio,yape', 'nullable', 'numeric', 'min:0'],
            'fecha' => [$esEstudiante ? 'nullable' : 'required', 'date'],
            'nota' => ['nullable', 'string', 'max:500'],
            'comprobante' => [
                $esEstudiante && $request->input('medio') !== 'efectivo' ? 'required' : 'nullable',
                'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf',
            ],
        ]);

        $comprobantePath = $request->hasFile('comprobante')
            ? $request->file('comprobante')->store('comprobantes-pago', 'local')
            : null;

        Pago::create([
            'cuota_id' => $cuota->id,
            'student_id' => $cuota->matricula->student_id,
            'registrado_por' => $esEstudiante ? null : $user->id,
            'monto' => $validated['monto'],
            'medio' => $validated['medio'],
            'monto_efectivo' => $validated['monto_efectivo'] ?? 0,
            'monto_yape' => $validated['monto_yape'] ?? 0,
            'fecha' => $esEstudiante ? now()->toDateString() : $validated['fecha'],
            'nota' => $validated['nota'] ?? null,
            'estado' => $esEstudiante ? 'declarado' : 'confirmado',
            'comprobante_path' => $comprobantePath,
            'confirmado_por' => $esEstudiante ? null : $user->id,
            'confirmado_at' => $esEstudiante ? null : now(),
            'fecha_limite_pago' => ($esEstudiante && $validated['medio'] === 'efectivo')
                ? now()->addDays(7)->toDateString()
                : null,
        ]);

        if (! $esEstudiante) {
            $cuota->registrarAbono((float) $validated['monto']);
            $cuota->matricula->recalcularEstado();
        }

        return back()->with('success', $esEstudiante
            ? 'Pago declarado. El área administrativa lo confirmará luego de verificarlo.'
            : 'Pago registrado correctamente.');
    }

    public function confirmar(Request $request, Pago $pago): RedirectResponse
    {
        $this->authorize('confirm', $pago);

        abort_if($pago->estado === 'confirmado', 409);

        if ((float) $pago->monto > $pago->cuota->saldoRestante()) {
            return back()->with('error', 'El saldo de la cuota ya no cubre este pago; revisa otros pagos pendientes antes de confirmar.');
        }

        $pago->update([
            'estado' => 'confirmado',
            'confirmado_por' => $request->user()->id,
            'confirmado_at' => now(),
            'fecha_limite_pago' => null,
        ]);

        $pago->cuota->registrarAbono((float) $pago->monto);
        $pago->cuota->matricula->recalcularEstado();

        return back()->with('success', 'Pago confirmado correctamente.');
    }

    public function comprobante(Pago $pago): View
    {
        $this->authorize('view', $pago);

        $pago->load(['cuota.matricula.student', 'cuota.matricula.carrera', 'registradoPor']);

        return view('comprobantes.pago-matricula', [
            'pago' => $pago,
            'cuota' => $pago->cuota,
            'matricula' => $pago->cuota->matricula,
            'student' => $pago->cuota->matricula->student,
            'numeroBoleta' => 'B001-' . str_pad((string) $pago->id, 8, '0', STR_PAD_LEFT),
            'montoEnLetras' => NumeroALetras::convertir((float) $pago->monto),
        ]);
    }

    public function comprobanteAdjunto(Pago $pago): StreamedResponse
    {
        $this->authorize('view', $pago);

        abort_unless($pago->comprobante_path, 404);
        abort_unless(Storage::disk('local')->exists($pago->comprobante_path), 404);

        return Storage::disk('local')->response($pago->comprobante_path);
    }

    public function destroy(Cuota $cuota, Pago $pago): RedirectResponse
    {
        $this->authorize('delete', $pago);

        if ($pago->estado === 'confirmado') {
            $cuota->monto_pagado -= $pago->monto;
            $cuota->actualizarEstado();
            $cuota->matricula->recalcularEstado();
        }

        if ($pago->comprobante_path) {
            Storage::disk('local')->delete($pago->comprobante_path);
        }

        $pago->delete();

        return back()->with('success', 'Pago eliminado correctamente.');
    }
}
