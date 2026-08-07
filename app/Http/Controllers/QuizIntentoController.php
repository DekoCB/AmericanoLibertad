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

        $intentosEnviados = $evaluation->quizIntentos()
            ->where('student_id', $user->student_id)
            ->whereNotNull('enviado_at')
            ->count();

        if ($intentosEnviados >= $evaluation->intentos_permitidos) {
            return redirect()->route('aula-virtual.show', $evaluation->course_id)
                ->with('error', 'Ya usaste todos tus intentos disponibles para este cuestionario.');
        }

        $intentoEnProgreso = $evaluation->quizIntentos()
            ->where('student_id', $user->student_id)
            ->whereNull('enviado_at')
            ->first();

        if (! $intentoEnProgreso) {
            $evaluation->quizIntentos()->create([
                'student_id' => $user->student_id,
                'puntaje' => 0,
                'enviado_at' => null,
            ]);
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

        $intento = $evaluation->quizIntentos()
            ->where('student_id', $user->student_id)
            ->whereNull('enviado_at')
            ->first();

        if (! $intento) {
            return redirect()->route('aula-virtual.show', $evaluation->course_id)
                ->with('error', 'No tienes un intento en curso para este cuestionario.');
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

        $intento->update(['puntaje' => $puntaje, 'enviado_at' => now()]);

        $mejorPuntaje = $evaluation->quizIntentos()
            ->where('student_id', $user->student_id)
            ->whereNotNull('enviado_at')
            ->max('puntaje');

        $evaluation->grades()->updateOrCreate(
            ['student_id' => $user->student_id],
            ['score' => $mejorPuntaje, 'comments' => 'Calificación automática (cuestionario, mejor intento)']
        );

        return redirect()->route('aula-virtual.show', $evaluation->course_id)
            ->with('success', "Cuestionario enviado. Obtuviste {$puntaje}/{$evaluation->max_score}.");
    }
}
