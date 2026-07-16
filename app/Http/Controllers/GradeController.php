<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function edit(Evaluation $evaluation): Response
    {
        $this->authorize('update', $evaluation);

        $evaluation->load(['course.subject']);

        $students = $evaluation->course
            ->enrollments()
            ->with('student')
            ->where('status', 'active')
            ->get()
            ->pluck('student');

        $grades = $evaluation->grades()->get()->keyBy('student_id');

        return Inertia::render('Grades/Edit', [
            'evaluation' => $evaluation,
            'students' => $students->map(fn ($student) => [
                'student_id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'score' => $grades->get($student->id)?->score,
                'comments' => $grades->get($student->id)?->comments,
            ])->values(),
        ]);
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('update', $evaluation);

        $validated = $request->validate([
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.score' => ['nullable', 'numeric', 'min:0', 'max:' . $evaluation->max_score],
            'grades.*.comments' => ['nullable', 'string', 'max:500'],
        ]);

        foreach ($validated['grades'] as $entry) {
            if ($entry['score'] === null) {
                continue;
            }

            $evaluation->grades()->updateOrCreate(
                ['student_id' => $entry['student_id']],
                ['score' => $entry['score'], 'comments' => $entry['comments'] ?? null]
            );
        }

        return redirect()->route('courses.show', $evaluation->course_id)->with('success', 'Calificaciones guardadas correctamente.');
    }
}
