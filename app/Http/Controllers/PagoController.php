<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Cuota;
use App\Models\IngresoManual;
use App\Models\Pago;
use App\Services\BloqueoAccesoService;
use App\Services\ReciboService;
use App\Support\NumeroALetras;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PagoController extends Controller
{
    public function __construct(
        private readonly BloqueoAccesoService $bloqueos,
        private readonly ReciboService $recibos,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Pago::class);

        $pagos = Pago::query()
            ->where('estado', 'confirmado')
            ->with(['student', 'cuota.matricula', 'recibo'])
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
            'pagosPendientes' => Pago::where('estado', 'pendiente')
                ->with('student')
                ->oldest('created_at')
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
            'medio' => ['required', Rule::in(['efectivo', 'yape', 'plin', 'tarjeta', 'mixto'])],
            'monto_efectivo' => ['required_if:medio,efectivo', 'nullable', 'numeric', 'min:0'],
            'monto_yape' => ['required_if:medio,yape', 'nullable', 'numeric', 'min:0'],
            'medios' => ['nullable', 'array'],
            'medios.*.medio' => ['required_with:medios', Rule::in(['efectivo', 'yape', 'plin', 'tarjeta'])],
            'medios.*.monto' => ['required_with:medios', 'numeric', 'min:0.01'],
            'fecha' => [$esEstudiante ? 'nullable' : 'required', 'date'],
            'nota' => ['nullable', 'string', 'max:500'],
            'comprobante' => [
                $esEstudiante && $request->input('medio') !== 'efectivo' ? 'required' : 'nullable',
                'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf',
            ],
        ]);

        if ($validated['medio'] === 'mixto') {
            $medios = collect($validated['medios'] ?? []);

            if ($medios->count() < 2) {
                throw ValidationException::withMessages([
                    'medios' => 'Debes ingresar al menos 2 medios de pago.',
                ]);
            }

            if ($medios->pluck('medio')->unique()->count() !== $medios->count()) {
                throw ValidationException::withMessages([
                    'medios' => 'Los medios de pago deben ser distintos entre sí.',
                ]);
            }

            if (round($medios->sum('monto'), 2) !== round((float) $validated['monto'], 2)) {
                throw ValidationException::withMessages([
                    'medios' => 'La suma de los dos medios debe ser igual al monto a pagar.',
                ]);
            }
        }

        $comprobantePath = $request->hasFile('comprobante')
            ? $request->file('comprobante')->store('comprobantes-pago', 'local')
            : null;

        $pago = Pago::create([
            'cuota_id' => $cuota->id,
            'student_id' => $cuota->matricula->student_id,
            'registrado_por' => $esEstudiante ? null : $user->id,
            'monto' => $validated['monto'],
            'medio' => $validated['medio'],
            'monto_efectivo' => $validated['monto_efectivo'] ?? 0,
            'monto_yape' => $validated['monto_yape'] ?? 0,
            'fecha' => $esEstudiante ? now()->toDateString() : $validated['fecha'],
            'nota' => $validated['nota'] ?? null,
            'estado' => 'pendiente',
            'comprobante_path' => $comprobantePath,
            'fecha_limite_pago' => ($esEstudiante && $validated['medio'] === 'efectivo')
                ? now()->addDays(7)->toDateString()
                : null,
        ]);

        if ($validated['medio'] === 'mixto') {
            $pago->medios()->createMany(
                collect($validated['medios'])->map(fn (array $m) => [
                    'medio' => $m['medio'],
                    'monto' => $m['monto'],
                ])->all()
            );
        }

        return back()->with('success', 'Pago registrado. Queda pendiente de aprobación.');
    }

    public function confirmar(Request $request, Pago $pago): RedirectResponse
    {
        $this->authorize('confirm', $pago);

        abort_if($pago->estado !== 'pendiente', 409);

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
        $this->bloqueos->evaluarYDesbloquear($pago->student);
        $this->recibos->emitir($pago);

        return back()->with('success', 'Pago confirmado correctamente.');
    }

    public function rechazar(Request $request, Pago $pago): RedirectResponse
    {
        $this->authorize('confirm', $pago);

        abort_if($pago->estado !== 'pendiente', 409);

        $validated = $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
        ]);

        $pago->update([
            'estado' => 'rechazado',
            'motivo_rechazo' => $validated['motivo'],
            'confirmado_por' => $request->user()->id,
            'confirmado_at' => now(),
            'fecha_limite_pago' => null,
        ]);

        $this->bloqueos->evaluarYDesbloquear($pago->student);

        return back()->with('success', 'Pago rechazado.');
    }

    public function confirmarVarios(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pago_ids' => ['required', 'array', 'min:1'],
            'pago_ids.*' => ['integer', 'exists:pagos,id'],
        ]);

        $user = $request->user();
        $aprobados = 0;
        $omitidos = 0;

        DB::transaction(function () use ($validated, $user, &$aprobados, &$omitidos) {
            $pagos = Pago::with(['cuota.matricula', 'student'])
                ->whereIn('id', $validated['pago_ids'])
                ->where('estado', 'pendiente')
                ->lockForUpdate()
                ->get();

            foreach ($pagos as $pago) {
                $this->authorize('confirm', $pago);

                if ((float) $pago->monto > $pago->cuota->saldoRestante()) {
                    $omitidos++;
                    continue;
                }

                $pago->update([
                    'estado' => 'confirmado',
                    'confirmado_por' => $user->id,
                    'confirmado_at' => now(),
                    'fecha_limite_pago' => null,
                ]);

                $pago->cuota->registrarAbono((float) $pago->monto);
                $pago->cuota->matricula->recalcularEstado();
                $this->bloqueos->evaluarYDesbloquear($pago->student);
                $this->recibos->emitir($pago);

                $aprobados++;
            }
        });

        $mensaje = sprintf('Se aprobaron %d pago%s.', $aprobados, $aprobados === 1 ? '' : 's');

        if ($omitidos > 0) {
            $mensaje .= " {$omitidos} se omitieron porque el saldo ya no los cubría.";
        }

        return back()->with($aprobados > 0 ? 'success' : 'error', $mensaje);
    }

    public function comprobante(Pago $pago): View
    {
        $this->authorize('view', $pago);

        $pago->load(['cuota.matricula.student', 'cuota.matricula.carrera', 'registradoPor', 'medios', 'recibo']);

        return view('comprobantes.pago-matricula', [
            'pago' => $pago,
            'cuota' => $pago->cuota,
            'matricula' => $pago->cuota->matricula,
            'student' => $pago->cuota->matricula->student,
            'numeroBoleta' => $pago->recibo?->numero_recibo ?? 'B001-' . str_pad((string) $pago->id, 8, '0', STR_PAD_LEFT),
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

    public function reciboDescargar(Pago $pago): StreamedResponse
    {
        $this->authorize('view', $pago);

        $recibo = $pago->recibo;

        abort_unless($recibo, 404);
        abort_unless(Storage::disk('local')->exists($recibo->pdf_path), 404);

        return Storage::disk('local')->response($recibo->pdf_path, "{$recibo->numero_recibo}.pdf");
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

        if ($pago->recibo) {
            Storage::disk('local')->delete($pago->recibo->pdf_path);
        }

        $pago->delete();

        return back()->with('success', 'Pago eliminado correctamente.');
    }
}
