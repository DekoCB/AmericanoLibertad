<?php

namespace App\Http\Controllers;

use App\Models\EntregaEvaluacion;
use App\Models\Evaluation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EntregaEvaluacionController extends Controller
{
    public function store(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('subir', [EntregaEvaluacion::class, $evaluation]);

        $validated = $request->validate([
            'archivo' => ['required', 'file', 'max:10240'],
        ]);

        $user = $request->user();

        $entregaExistente = $evaluation->entregas()->where('student_id', $user->student_id)->first();

        if ($entregaExistente) {
            Storage::disk('public')->delete($entregaExistente->archivo);
        }

        $archivo = $validated['archivo'];
        $path = $archivo->store('entregas', 'public');

        $evaluation->entregas()->updateOrCreate(
            ['student_id' => $user->student_id],
            [
                'archivo' => $path,
                'nombre_original' => $archivo->getClientOriginalName(),
                'enviado_at' => now(),
            ]
        );

        return redirect()->route('aula-virtual.show', $evaluation->course_id)
            ->with('success', 'Entrega subida correctamente.');
    }
}
