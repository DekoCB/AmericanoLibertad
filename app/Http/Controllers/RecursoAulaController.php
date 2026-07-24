<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\RecursoAula;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RecursoAulaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $courses = Course::query()
            ->with(['subject', 'teacher'])
            ->withCount('recursosAula')
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->when(
                $user->hasRole(UserRole::Estudiante),
                fn ($query) => $query->whereHas('enrollments', fn ($q) => $q->where('student_id', $user->student_id))
            )
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        return Inertia::render('AulaVirtual/Index', [
            'courses' => $courses,
            'isStudent' => $user->hasRole(UserRole::Estudiante),
        ]);
    }

    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', [RecursoAula::class, $course]);

        $user = $request->user();
        $isStudent = $user->hasRole(UserRole::Estudiante);

        $evaluaciones = $course->evaluations()
            ->whereNotNull('semana')
            ->orderBy('semana')
            ->get()
            ->map(function ($evaluation) use ($user, $isStudent) {
                $data = $evaluation->toArray();

                if ($evaluation->type === 'quiz') {
                    $data['preguntas_count'] = $evaluation->quizPreguntas()->count();

                    if ($isStudent && $user->student_id) {
                        $data['mi_intento'] = $evaluation->quizIntentos()
                            ->where('student_id', $user->student_id)
                            ->first();
                    }
                }

                if (in_array($evaluation->type, ['homework', 'project'], true) && $isStudent && $user->student_id) {
                    $data['mi_entrega'] = $evaluation->entregas()
                        ->where('student_id', $user->student_id)
                        ->first();
                }

                return $data;
            });

        return Inertia::render('AulaVirtual/Show', [
            'course' => $course->load(['subject', 'teacher']),
            'recursos' => $course->recursosAula()->orderBy('semana')->latest()->get(),
            'evaluaciones' => $evaluaciones,
            'can' => [
                'manage' => $request->user()->can('manage', [RecursoAula::class, $course]),
            ],
            'isStudent' => $isStudent,
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        $validated = $request->validate([
            'semana' => ['nullable', 'integer', 'min:1', 'max:16'],
            'titulo' => ['required', 'string', 'max:150'],
            'tipo' => ['required', Rule::in(['enlace', 'archivo', 'anuncio'])],
            'entregable' => ['boolean'],
            'fecha_entrega' => ['nullable', 'date', 'required_if:entregable,1'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'url' => ['nullable', 'url', 'max:500'],
            'archivo' => ['nullable', 'file', 'max:10240'],
        ]);

        $validated['semana'] = $validated['semana'] !== '' ? $validated['semana'] : null;
        $validated['fecha_entrega'] = $validated['fecha_entrega'] !== '' ? $validated['fecha_entrega'] : null;

        if (! empty($validated['archivo'])) {
            $archivo = $validated['archivo'];
            $validated['archivo_nombre'] = $archivo->getClientOriginalName();
            $validated['archivo'] = $archivo->store('recursos', 'public');
        } else {
            unset($validated['archivo']);
        }

        $course->recursosAula()->create([
            ...$validated,
            'creado_por' => $request->user()->id,
        ]);

        return redirect()->route('aula-virtual.show', $course)->with('success', 'Recurso publicado correctamente.');
    }

    public function destroy(Course $course, RecursoAula $recurso): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        if ($recurso->archivo) {
            Storage::disk('public')->delete($recurso->archivo);
        }

        $recurso->delete();

        return redirect()->route('aula-virtual.show', $course)->with('success', 'Recurso eliminado correctamente.');
    }
}
