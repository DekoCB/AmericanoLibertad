<?php

namespace App\Http\Controllers;

use App\Models\Cuota;
use App\Models\Matricula;
use App\Models\Pago;
use App\Models\Student;
use App\Support\NumeroALetras;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Pago::class);

        $pagos = Pago::query()
            ->with(['student', 'cuota.matricula'])
            ->when($request->string('student_id')->toString(), function ($query, $studentId) {
                $query->where('student_id', $studentId);
            })
            ->latest('fecha')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Ingresos/Index', [
            'pagos' => $pagos,
            'allStudents' => Student::orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'document_number']),
            'filters' => $request->only(['student_id']),
        ]);
    }

    public function store(Request $request, Cuota $cuota): RedirectResponse
    {
        $this->authorize('create', Pago::class);

        $validated = $request->validate([
            'monto' => ['required', 'numeric', 'min:0.01', 'max:' . $cuota->saldoRestante()],
            'medio' => ['required', Rule::in(['efectivo', 'yape', 'plin', 'tarjeta'])],
            'monto_efectivo' => ['required_if:medio,efectivo', 'nullable', 'numeric', 'min:0'],
            'monto_yape' => ['required_if:medio,yape', 'nullable', 'numeric', 'min:0'],
            'fecha' => ['required', 'date'],
            'nota' => ['nullable', 'string', 'max:500'],
        ]);

        Pago::create([
            'cuota_id' => $cuota->id,
            'student_id' => $cuota->matricula->student_id,
            'registrado_por' => $request->user()->id,
            'monto' => $validated['monto'],
            'medio' => $validated['medio'],
            'monto_efectivo' => $validated['monto_efectivo'] ?? 0,
            'monto_yape' => $validated['monto_yape'] ?? 0,
            'fecha' => $validated['fecha'],
            'nota' => $validated['nota'] ?? null,
        ]);

        $cuota->monto_pagado += $validated['monto'];
        $cuota->actualizarEstado();

        $this->recalcularEstadoMatricula($cuota->matricula);

        return back()->with('success', 'Pago registrado correctamente.');
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

    public function destroy(Cuota $cuota, Pago $pago): RedirectResponse
    {
        $this->authorize('delete', $pago);

        $cuota->monto_pagado -= $pago->monto;
        $pago->delete();
        $cuota->actualizarEstado();

        $this->recalcularEstadoMatricula($cuota->matricula);

        return back()->with('success', 'Pago eliminado correctamente.');
    }

    private function recalcularEstadoMatricula(Matricula $matricula): void
    {
        $cuotas = $matricula->cuotas()->get();

        if ($cuotas->every(fn ($cuota) => $cuota->estado === 'pagado')) {
            $matricula->estado = 'pagado';
        } elseif ($cuotas->contains(fn ($cuota) => in_array($cuota->estado, ['parcial', 'pagado'], true))) {
            $matricula->estado = 'parcial';
        } elseif ($cuotas->contains(fn ($cuota) => $cuota->estado === 'vencido')) {
            $matricula->estado = 'vencido';
        } else {
            $matricula->estado = 'pendiente';
        }

        $matricula->save();
    }
}
