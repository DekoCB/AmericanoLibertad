<?php

namespace App\Http\Controllers;

use App\Models\Cuota;
use App\Models\Matricula;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CuotaController extends Controller
{
    public function store(Request $request, Matricula $matricula): RedirectResponse
    {
        $this->authorize('update', $matricula);

        $validated = $request->validate([
            'mes' => ['required', 'string', 'max:20'],
            'monto_programado' => ['required', 'numeric', 'min:0'],
            'fecha_vencimiento' => ['required', 'date'],
        ]);

        $matricula->cuotas()->create([
            'tipo' => 'pension',
            'mes' => $validated['mes'],
            'monto_programado' => $validated['monto_programado'],
            'monto_pagado' => 0,
            'fecha_vencimiento' => $validated['fecha_vencimiento'],
            'estado' => 'pendiente',
        ]);

        return back()->with('success', 'Cuota de pensión agregada correctamente.');
    }

    public function destroy(Matricula $matricula, Cuota $cuota): RedirectResponse
    {
        $this->authorize('update', $matricula);

        $cuota->delete();

        return back()->with('success', 'Cuota eliminada correctamente.');
    }
}
