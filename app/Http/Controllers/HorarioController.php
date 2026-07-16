<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Carrera;
use App\Models\Course;
use App\Models\Horario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Course::class);

        $courses = Course::query()
            ->with(['subject.carrera', 'teacher', 'horarios'])
            ->when(
                $request->user()->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $request->user()->teacher_id)
            )
            ->when($request->integer('carrera_id'), function ($query, $carreraId) {
                $query->whereHas('subject', fn ($q) => $q->where('carrera_id', $carreraId));
            })
            ->when($request->integer('ciclo'), function ($query, $ciclo) {
                $query->whereHas('subject', fn ($q) => $q->where('ciclo', $ciclo));
            })
            ->when($request->string('turno')->toString(), function ($query, $turno) {
                $query->where('turno', $turno);
            })
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        return Inertia::render('Horarios/Index', [
            'courses' => $courses,
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
            'filters' => $request->only('carrera_id', 'ciclo', 'turno'),
            'can' => [
                'manage' => $request->user()->can('update', new Course()),
            ],
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('update', $course);

        $course->horarios()->create($this->validateHorario($request));

        return redirect()->route('courses.show', $course)->with('success', 'Horario agregado correctamente.');
    }

    public function destroy(Course $course, Horario $horario): RedirectResponse
    {
        $this->authorize('update', $course);

        $horario->delete();

        return redirect()->route('courses.show', $course)->with('success', 'Horario eliminado correctamente.');
    }

    private function validateHorario(Request $request): array
    {
        return $request->validate([
            'dia_semana' => ['required', Rule::in(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'])],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'aula' => ['nullable', 'string', 'max:50'],
        ]);
    }
}
