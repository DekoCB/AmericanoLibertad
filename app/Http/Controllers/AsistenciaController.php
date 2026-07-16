<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Asistencia;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AsistenciaController extends Controller
{
    public function cursos(Request $request): Response
    {
        $this->authorize('viewAny', Course::class);

        $user = $request->user();

        $courses = Course::query()
            ->with(['subject', 'teacher'])
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        return Inertia::render('Asistencias/Cursos', [
            'courses' => $courses,
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

        $this->marcarAsistencia(
            $course,
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
            ->whereHas('student', fn ($q) => $q->where('document_number', $validated['document_number']))
            ->first();

        if (! $enrollment) {
            return redirect()->back()->with('error', 'El estudiante no está matriculado en este curso.');
        }

        $this->marcarAsistencia(
            $course,
            $enrollment->student_id,
            $validated['fecha'],
            'presente',
            $request->user()->id,
        );

        return redirect()->back()->with('success', 'Asistencia registrada correctamente.');
    }

    private function marcarAsistencia(
        Course $course,
        int $studentId,
        string $fecha,
        string $estado,
        int $registradoPor,
    ): void {
        $asistencia = Asistencia::where('course_id', $course->id)
            ->where('student_id', $studentId)
            ->whereDate('fecha', $fecha)
            ->first() ?? new Asistencia([
                'course_id' => $course->id,
                'student_id' => $studentId,
                'fecha' => $fecha,
            ]);

        $asistencia->fill([
            'estado' => $estado,
            'hora_registro' => now(),
            'registrado_por' => $registradoPor,
        ])->save();
    }
}
