<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('create', [Enrollment::class, $course]);

        $validated = $request->validate([
            'student_id' => [
                'required',
                'exists:students,id',
                Rule::unique('enrollments')->where('course_id', $course->id),
            ],
        ]);

        $course->enrollments()->create([
            'student_id' => $validated['student_id'],
            'enrolled_at' => now(),
            'status' => 'active',
        ]);

        return redirect()->route('courses.show', $course)->with('success', 'Estudiante matriculado correctamente.');
    }

    public function destroy(Course $course, Enrollment $enrollment): RedirectResponse
    {
        $this->authorize('delete', $enrollment);

        $enrollment->delete();

        return back()->with('success', 'Matrícula eliminada correctamente.');
    }
}
