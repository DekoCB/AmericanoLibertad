<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Asistencia;
use App\Models\Carrera;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AsistenciaController extends Controller
{
    public function cursos(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole(UserRole::Estudiante)) {
            return $this->misAsistencias($request);
        }

        $this->authorize('viewAny', Course::class);

        $esDocente = $user->hasRole(UserRole::Docente);

        $courses = Course::query()
            ->with(['subject.carrera', 'teacher'])
            ->withCount('enrollments')
            ->when(
                $esDocente,
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        return Inertia::render('Asistencias/Cursos', [
            'courses' => $courses,
            'viewMode' => $esDocente ? 'docente' : 'staff',
            'can' => [
                'viewHistorial' => $user->can('viewHistorial', Asistencia::class),
            ],
        ]);
    }

    public function index(Request $request, Course $course): Response
    {
        $this->authorize('manage', [Asistencia::class, $course]);

        $fecha = $request->string('fecha')->toString() ?: now()->toDateString();

        $enrollments = $course->enrollments()
            ->with('student')
            ->where('status', 'active')
            ->get()
            ->sortBy(fn ($enrollment) => $enrollment->student?->last_name)
            ->values();

        $asistencias = $course->asistencias()
            ->whereDate('fecha', $fecha)
            ->get()
            ->keyBy('student_id');

        $sheet = $enrollments->map(fn ($enrollment) => [
            'student' => $enrollment->student,
            'asistencia' => $asistencias->get($enrollment->student_id),
        ]);

        return Inertia::render('Asistencias/Index', [
            'course' => $course->load(['subject', 'teacher']),
            'fecha' => $fecha,
            'sheet' => $sheet,
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('manage', [Asistencia::class, $course]);

        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'fecha' => ['required', 'date'],
            'estado' => ['required', Rule::in(['presente', 'tardanza', 'falta', 'justificado'])],
        ]);

        Asistencia::marcar(
            $course->id,
            $validated['student_id'],
            $validated['fecha'],
            $validated['estado'],
            $request->user()->id,
        );

        return redirect()->back()->with('success', 'Asistencia registrada correctamente.');
    }

    public function escanear(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('manage', [Asistencia::class, $course]);

        $validated = $request->validate([
            'document_number' => ['required', 'string'],
            'fecha' => ['required', 'date'],
        ]);

        $enrollment = $course->enrollments()
            ->whereHas('student', function ($q) use ($validated) {
                $q->where('document_number', $validated['document_number'])
                    ->orWhere('qr_token', $validated['document_number']);
            })
            ->first();

        if (! $enrollment) {
            return redirect()->back()->with('error', 'El estudiante no está matriculado en este curso.');
        }

        Asistencia::marcar(
            $course->id,
            $enrollment->student_id,
            $validated['fecha'],
            'presente',
            $request->user()->id,
        );

        return redirect()->back()->with('success', 'Asistencia registrada correctamente.');
    }

    public function historial(Request $request): Response
    {
        $this->authorize('viewHistorial', Asistencia::class);

        $fecha = $request->string('fecha')->toString() ?: now()->toDateString();
        $carreraId = $request->string('carrera_id')->toString();
        $courseId = $request->string('course_id')->toString();
        $studentId = $request->string('student_id')->toString();

        $asistencias = Asistencia::query()
            ->with(['student.carrera', 'course.subject'])
            ->whereDate('fecha', $fecha)
            ->when($carreraId, function ($query) use ($carreraId) {
                $query->whereHas('student', fn ($q) => $q->where('carrera_id', $carreraId));
            })
            ->when($courseId, function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->when($studentId, function ($query) use ($studentId) {
                $query->where('student_id', $studentId);
            })
            ->orderByDesc('fecha')
            ->orderBy('student_id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Asistencias/Historial', [
            'asistencias' => $asistencias,
            'carreras' => Carrera::orderBy('name')->get(['id', 'name']),
            'courses' => Course::with('subject')->orderBy('name')->get(['id', 'name', 'subject_id']),
            'students' => Student::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'filters' => [
                'fecha' => $fecha,
                'carrera_id' => $carreraId,
                'course_id' => $courseId,
                'student_id' => $studentId,
            ],
        ]);
    }

    private function misAsistencias(Request $request): Response
    {
        $this->authorize('markOwn', Asistencia::class);

        $student = Student::with('carrera')->findOrFail($request->user()->student_id);

        $courses = Course::query()
            ->with('subject')
            ->whereHas('enrollments', fn ($q) => $q->where('student_id', $student->id)->where('status', 'active'))
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        $mes = $request->string('mes')->toString() ?: now()->format('Y-m');

        $historial = Asistencia::query()
            ->with('course.subject')
            ->where('student_id', $student->id)
            ->when(DB::connection()->getDriverName() === 'sqlite',
                fn ($q) => $q->whereRaw("strftime('%Y-%m', fecha) = ?", [$mes]),
                fn ($q) => $q->whereRaw("DATE_FORMAT(fecha, '%Y-%m') = ?", [$mes])
            )
            ->orderByDesc('fecha')
            ->get();

        return Inertia::render('Asistencias/Estudiante', [
            'student' => $student,
            'courses' => $courses,
            'mes' => $mes,
            'historial' => $historial,
        ]);
    }

    public function escanearPropio(Request $request): RedirectResponse
    {
        $this->authorize('markOwn', Asistencia::class);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'codigo' => ['required', 'string'],
        ]);

        $student = Student::findOrFail($request->user()->student_id);

        if ($validated['codigo'] !== $student->qr_token && $validated['codigo'] !== $student->document_number) {
            return redirect()->back()->with('error', 'El código escaneado no corresponde a tu carné.');
        }

        $enrolled = Enrollment::where('course_id', $validated['course_id'])
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->exists();

        if (! $enrolled) {
            return redirect()->back()->with('error', 'No estás matriculado en este curso.');
        }

        Asistencia::marcar(
            (int) $validated['course_id'],
            $student->id,
            now()->toDateString(),
            'presente',
            $request->user()->id,
        );

        return redirect()->back()->with('success', 'Tu asistencia fue registrada correctamente.');
    }
}
