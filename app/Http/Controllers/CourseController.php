<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Carrera;
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
            ->when($request->string('name')->toString(), function ($query, $name) {
                $query->where('name', $name);
            })
            ->when($request->string('carrera_name')->toString(), function ($query, $carreraName) {
                $query->whereHas('subject.carrera', fn ($q) => $q->where('name', $carreraName));
            })
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        $upcomingEvaluations = Evaluation::with('course.subject')
            ->when(
                $request->user()->hasRole(UserRole::Docente),
                fn ($query) => $query->whereHas(
                    'course',
                    fn ($q) => $q->where('teacher_id', $request->user()->teacher_id)
                )
            )
            ->whereDate('date', '>=', now())
            ->orderBy('date')
            ->limit(6)
            ->get();

        $nombresSecciones = Course::query()
            ->when(
                $request->user()->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $request->user()->teacher_id)
            )
            ->orderBy('name')
            ->distinct()
            ->pluck('name');

        $nombresCarreras = Carrera::orderBy('name')->pluck('name');

        return Inertia::render('Courses/Index', [
            'courses' => $courses,
            'nombresSecciones' => $nombresSecciones,
            'nombresCarreras' => $nombresCarreras,
            'filters' => $request->only('name', 'carrera_name'),
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
            'teachers' => Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'upcomingEvaluations' => $upcomingEvaluations,
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

        return redirect()->route('courses.index')->with('success', 'Sección creada correctamente.');
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
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
            'teachers' => Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
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

        return redirect()->back()->with('success', 'Sección actualizada correctamente.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $course->delete();

        return redirect()->route('courses.index')->with('success', 'Sección eliminada correctamente.');
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
