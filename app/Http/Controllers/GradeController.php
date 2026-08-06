<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Evaluation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless(
            $user->hasRole(UserRole::Docente, UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico),
            403,
        );

        $esDocente = $user->hasRole(UserRole::Docente);

        $evaluations = Evaluation::query()
            ->with(['course.subject', 'course.teacher'])
            ->withCount('grades')
            ->when(
                $esDocente,
                fn ($query) => $query->whereHas('course', fn ($q) => $q->where('teacher_id', $user->teacher_id))
            )
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhereHas('course', fn ($q2) => $q2->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('course.subject', fn ($q2) => $q2->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('date')
            ->get();

        $evaluations->each(function (Evaluation $evaluation) {
            $evaluation->total_estudiantes = $evaluation->course
                ->enrollments()
                ->where('status', 'active')
                ->count();
        });

        return Inertia::render('Grades/Index', [
            'evaluations' => $evaluations,
            'filters' => $request->only('search'),
            'isDocente' => $esDocente,
        ]);
    }

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
        $entregas = $evaluation->entregas()->get()->keyBy('student_id');

        return Inertia::render('Grades/Edit', [
            'evaluation' => $evaluation,
            'students' => $students->map(function ($student) use ($grades, $entregas) {
                $entrega = $entregas->get($student->id);

                return [
                    'student_id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'score' => $grades->get($student->id)?->score,
                    'comments' => $grades->get($student->id)?->comments,
                    'entrega_nombre' => $entrega?->nombre_original,
                    'entrega_url' => $entrega ? Storage::disk('public')->url($entrega->archivo) : null,
                ];
            })->values(),
        ]);
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $this->authorize('update', $evaluation);

        $validated = $request->validate([
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.score' => ['nullable', 'integer', 'min:0', 'max:' . $evaluation->max_score],
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
