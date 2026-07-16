<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Course::class);

        $courses = Course::query()
            ->with(['subject', 'teacher'])
            ->withCount('enrollments')
            ->when(
                $request->user()->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $request->user()->teacher_id)
            )
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhereHas('subject', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->orderByDesc('period')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Courses/Index', [
            'courses' => $courses,
            'filters' => $request->only('search'),
            'can' => [
                'create' => $request->user()->can('create', Course::class),
                'update' => $request->user()->hasRole(UserRole::Gerencia, UserRole::Coordinador, UserRole::Academico, UserRole::Docente),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Course::class);

        return Inertia::render('Courses/Create', [
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
            'teachers' => Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Course::class);

        Course::create($this->validateCourse($request));

        return redirect()->route('courses.index')->with('success', 'Curso creado correctamente.');
    }

    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', $course);

        $course->load(['subject', 'teacher']);

        $enrollments = $course->enrollments()
            ->with('student')
            ->orderBy('enrolled_at')
            ->get();

        $evaluations = $course->evaluations()->withCount('grades')->orderBy('date')->get();

        $canManageEnrollments = $request->user()->can('create', Enrollment::class);

        $availableStudents = $canManageEnrollments
            ? Student::whereNotIn('id', $enrollments->pluck('student_id'))
                ->where('status', 'active')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])
            : [];

        return Inertia::render('Courses/Show', [
            'course' => $course,
            'enrollments' => $enrollments,
            'evaluations' => $evaluations,
            'availableStudents' => $availableStudents,
            'can' => [
                'manageEnrollments' => $canManageEnrollments,
                'manageCourse' => $request->user()->can('update', $course),
                'deleteCourse' => $request->user()->can('delete', $course),
                'manageEvaluations' => $request->user()->can('create', [Evaluation::class, $course]),
            ],
        ]);
    }

    public function edit(Course $course): Response
    {
        $this->authorize('update', $course);

        return Inertia::render('Courses/Edit', [
            'course' => $course,
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
            'teachers' => Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('update', $course);

        $course->update($this->validateCourse($request));

        return redirect()->route('courses.index')->with('success', 'Curso actualizado correctamente.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $course->delete();

        return redirect()->route('courses.index')->with('success', 'Curso eliminado correctamente.');
    }

    private function validateCourse(Request $request): array
    {
        return $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'name' => ['required', 'string', 'max:150'],
            'period' => ['required', 'string', 'max:20'],
            'schedule' => ['nullable', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1', 'max:200'],
        ]);
    }
}
