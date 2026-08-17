<?php

namespace App\Http\Controllers;

use App\Models\ConfiguracionPago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionPagoController extends Controller
{
    public function edit(Request $request): Response
    {
        $this->authorize('view', ConfiguracionPago::class);

        return Inertia::render('ConfiguracionPagos/Edit', [
            'configuracion' => ConfiguracionPago::actual(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorize('update', ConfiguracionPago::class);

        $validated = $request->validate([
            'yape_numero' => ['nullable', 'string', 'max:20'],
            'yape_qr' => ['nullable', 'image', 'max:2048'],
            'plin_numero' => ['nullable', 'string', 'max:20'],
            'plin_qr' => ['nullable', 'image', 'max:2048'],
            'cuenta_detalle' => ['nullable', 'string', 'max:2000'],
        ]);

        $configuracion = ConfiguracionPago::actual();

        $datos = [
            'yape_numero' => $validated['yape_numero'] ?? null,
            'plin_numero' => $validated['plin_numero'] ?? null,
            'cuenta_detalle' => $validated['cuenta_detalle'] ?? null,
        ];

        if ($request->hasFile('yape_qr')) {
            if ($configuracion->yape_qr_path) {
                Storage::disk('public')->delete($configuracion->yape_qr_path);
            }
            $datos['yape_qr_path'] = $request->file('yape_qr')->store('configuracion-pagos', 'public');
        }

        if ($request->hasFile('plin_qr')) {
            if ($configuracion->plin_qr_path) {
                Storage::disk('public')->delete($configuracion->plin_qr_path);
            }
            $datos['plin_qr_path'] = $request->file('plin_qr')->store('configuracion-pagos', 'public');
        }

        $configuracion->update($datos);

        return back()->with('success', 'Métodos de pago actualizados correctamente.');
    }
}
