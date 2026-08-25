<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Evaluation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    public function create(Course $course): Response
    {
        $this->authorize('create', [Evaluation::class, $course]);

        return Inertia::render('Evaluations/Create', [
            'course' => $course->load('subject'),
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('create', [Evaluation::class, $course]);

        $course->evaluations()->create($this->validateEvaluation($request));

        return back()->with('success', 'Evaluación creada correctamente.');
    }

    public function edit(Evaluation $evaluation): Response
    {
        $this->authorize('update', $evaluation);

        return Inertia::render('Evaluations/Edit', [
            'evaluation' => $evaluation,
            'course' => $evaluation->course->load('subject'),
        ]);
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('update', $evaluation);

        $evaluation->update($this->validateEvaluation($request));

        return redirect()->route('courses.show', $evaluation->course_id)->with('success', 'Evaluación actualizada correctamente.');
    }

    public function destroy(Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('delete', $evaluation);

        $courseId = $evaluation->course_id;

        $evaluation->delete();

        return redirect()->route('courses.show', $courseId)->with('success', 'Evaluación eliminada correctamente.');
    }

    private function validateEvaluation(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', 'in:exam,quiz,homework,project,comportamiento'],
            'weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'date' => ['required', 'date'],
            'semana' => [
                $request->input('type') === 'comportamiento' ? 'nullable' : 'required',
                'integer', 'min:1', 'max:20',
            ],
            'max_score' => ['required', 'integer', 'min:1', 'max:20'],
            'intentos_permitidos' => ['required', 'integer', 'min:1', 'max:10'],
            'grupo_notas_id' => ['nullable', 'exists:grupos_notas,id'],
        ]);
    }
}
