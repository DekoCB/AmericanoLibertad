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
        return Inertia::render('Evaluations/Create', [
            'course' => $course->load('subject'),
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $course->evaluations()->create($this->validateEvaluation($request));

        return redirect()->route('courses.show', $course)->with('success', 'Evaluación creada correctamente.');
    }

    public function edit(Evaluation $evaluation): Response
    {
        return Inertia::render('Evaluations/Edit', [
            'evaluation' => $evaluation,
            'course' => $evaluation->course->load('subject'),
        ]);
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $evaluation->update($this->validateEvaluation($request));

        return redirect()->route('courses.show', $evaluation->course_id)->with('success', 'Evaluación actualizada correctamente.');
    }

    public function destroy(Evaluation $evaluation): RedirectResponse
    {
        $courseId = $evaluation->course_id;

        $evaluation->delete();

        return redirect()->route('courses.show', $courseId)->with('success', 'Evaluación eliminada correctamente.');
    }

    private function validateEvaluation(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', 'in:exam,quiz,homework,project'],
            'weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'date' => ['required', 'date'],
            'max_score' => ['required', 'numeric', 'min:1', 'max:1000'],
        ]);
    }
}
