<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\QuizIntento;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuizIntentoController extends Controller
{
    public function create(Request $request, Evaluation $evaluation): Response|RedirectResponse
    {
        $this->authorize('resolver', [QuizIntento::class, $evaluation]);

        $user = $request->user();

        $yaResuelto = $evaluation->quizIntentos()
            ->where('student_id', $user->student_id)
            ->exists();

        if ($yaResuelto) {
            return redirect()->route('aula-virtual.show', $evaluation->course_id)
                ->with('error', 'Ya respondiste este cuestionario.');
        }

        return Inertia::render('Evaluations/ResolverQuiz', [
            'evaluation' => $evaluation->load('course.subject'),
            'preguntas' => $evaluation->quizPreguntas()->with('opciones')->get()
                ->map(fn ($pregunta) => [
                    'id' => $pregunta->id,
                    'texto' => $pregunta->texto,
                    'opciones' => $pregunta->opciones->map(fn ($opcion) => [
                        'id' => $opcion->id,
                        'texto' => $opcion->texto,
                    ])->values(),
                ]),
        ]);
    }

    public function store(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('resolver', [QuizIntento::class, $evaluation]);

        $user = $request->user();

        if ($evaluation->quizIntentos()->where('student_id', $user->student_id)->exists()) {
            return redirect()->route('aula-virtual.show', $evaluation->course_id)
                ->with('error', 'Ya respondiste este cuestionario.');
        }

        $preguntas = $evaluation->quizPreguntas()->with('opciones')->get();

        if ($preguntas->isEmpty()) {
            return redirect()->route('aula-virtual.show', $evaluation->course_id)
                ->with('error', 'Este cuestionario todavía no tiene preguntas.');
        }

        $validated = $request->validate([
            'respuestas' => ['required', 'array'],
            'respuestas.*' => ['nullable', 'integer', 'exists:quiz_opciones,id'],
        ]);

        $respuestasPorPregunta = collect($validated['respuestas']);

        $intento = $evaluation->quizIntentos()->create([
            'student_id' => $user->student_id,
            'puntaje' => 0,
            'enviado_at' => now(),
        ]);

        $correctas = 0;

        foreach ($preguntas as $pregunta) {
            $opcionElegidaId = $respuestasPorPregunta->get($pregunta->id);
            $opcionElegida = $opcionElegidaId
                ? $pregunta->opciones->firstWhere('id', (int) $opcionElegidaId)
                : null;

            if ($opcionElegida && $opcionElegida->es_correcta) {
                $correctas++;
            }

            $intento->respuestas()->create([
                'quiz_pregunta_id' => $pregunta->id,
                'quiz_opcion_id' => $opcionElegida?->id,
            ]);
        }

        $puntaje = (int) round(($correctas / $preguntas->count()) * $evaluation->max_score);

        $intento->update(['puntaje' => $puntaje]);

        $evaluation->grades()->updateOrCreate(
            ['student_id' => $user->student_id],
            ['score' => $puntaje, 'comments' => 'Calificación automática (cuestionario)']
        );

        return redirect()->route('aula-virtual.show', $evaluation->course_id)
            ->with('success', "Cuestionario enviado. Obtuviste {$puntaje}/{$evaluation->max_score}.");
    }
}
