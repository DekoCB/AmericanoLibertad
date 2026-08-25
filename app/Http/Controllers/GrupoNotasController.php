<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\GrupoNotas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GrupoNotasController extends Controller
{
    public function update(Request $request, GrupoNotas $grupoNotas): RedirectResponse
    {
        $this->authorize('create', [Evaluation::class, $grupoNotas->course]);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'peso' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $grupoNotas->update($validated);

        return back()->with('success', 'Grupo de notas actualizado correctamente.');
    }
}
