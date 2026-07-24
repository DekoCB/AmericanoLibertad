<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\QuizPregunta;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuizPreguntaController extends Controller
{
    public function index(Evaluation $evaluation): Response
    {
        $this->authorize('update', $evaluation);

        return Inertia::render('Evaluations/Preguntas', [
            'evaluation' => $evaluation->load('course.subject'),
            'preguntas' => $evaluation->quizPreguntas()->with('opciones')->get(),
            'tieneIntentos' => $evaluation->quizIntentos()->exists(),
        ]);
    }

    public function store(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('update', $evaluation);

        if ($evaluation->quizIntentos()->exists()) {
            return back()->with('error', 'No se pueden agregar preguntas: ya hay estudiantes que respondieron este cuestionario.');
        }

        $validated = $this->validatePregunta($request);

        $pregunta = $evaluation->quizPreguntas()->create([
            'texto' => $validated['texto'],
            'orden' => $evaluation->quizPreguntas()->count() + 1,
        ]);

        foreach ($validated['opciones'] as $opcion) {
            $pregunta->opciones()->create($opcion);
        }

        return back()->with('success', 'Pregunta agregada correctamente.');
    }

    public function update(Request $request, QuizPregunta $pregunta): RedirectResponse
    {
        $this->authorize('update', $pregunta->evaluation);

        if ($pregunta->evaluation->quizIntentos()->exists()) {
            return back()->with('error', 'No se puede editar: ya hay estudiantes que respondieron este cuestionario.');
        }

        $validated = $this->validatePregunta($request);

        $pregunta->update(['texto' => $validated['texto']]);

        $pregunta->opciones()->delete();
        foreach ($validated['opciones'] as $opcion) {
            $pregunta->opciones()->create($opcion);
        }

        return back()->with('success', 'Pregunta actualizada correctamente.');
    }

    public function destroy(QuizPregunta $pregunta): RedirectResponse
    {
        $this->authorize('update', $pregunta->evaluation);

        if ($pregunta->evaluation->quizIntentos()->exists()) {
            return back()->with('error', 'No se puede eliminar: ya hay estudiantes que respondieron este cuestionario.');
        }

        $pregunta->delete();

        return back()->with('success', 'Pregunta eliminada correctamente.');
    }

    private function validatePregunta(Request $request): array
    {
        $validated = $request->validate([
            'texto' => ['required', 'string', 'max:500'],
            'opciones' => ['required', 'array', 'min:2', 'max:6'],
            'opciones.*.texto' => ['required', 'string', 'max:255'],
            'opciones.*.es_correcta' => ['boolean'],
        ]);

        $correctas = collect($validated['opciones'])
            ->filter(fn ($o) => (bool) ($o['es_correcta'] ?? false))
            ->count();

        if ($correctas !== 1) {
            throw ValidationException::withMessages([
                'opciones' => 'Debes marcar exactamente una opción como correcta.',
            ]);
        }

        return $validated;
    }
}
