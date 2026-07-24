<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Teacher::class);

        $teachers = Teacher::query()
            ->with('user')
            ->when($request->string('teacher_id')->toString(), function ($query, $teacherId) {
                $query->where('id', $teacherId);
            })
            ->when($request->string('specialty')->toString(), function ($query, $specialty) {
                $query->whereRaw('JSON_CONTAINS(specialty, ?)', [json_encode($specialty)]);
            })
            ->withCount('courses')
            ->orderBy('last_name')
            ->paginate(15)
            ->withQueryString();

        $especialidadesAsignadas = Teacher::whereNotNull('specialty')->pluck('specialty')->flatten()->unique();

        return Inertia::render('Teachers/Index', [
            'teachers' => $teachers,
            'allTeachers' => Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email']),
            'filters' => $request->only(['teacher_id', 'specialty']),
            'specialties' => Subject::orderBy('name')->pluck('name')->unique()
                ->merge($especialidadesAsignadas)
                ->unique()
                ->sort()
                ->values(),
            'can' => [
                'create' => $request->user()->can('create', Teacher::class),
                'update' => $request->user()->can('update', new Teacher()),
                'delete' => $request->user()->can('delete', new Teacher()),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Teacher::class);

        return Inertia::render('Teachers/Create', [
            'specialties' => Subject::orderBy('name')->pluck('name')->unique()->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Teacher::class);

        Teacher::create($this->validateTeacher($request));

        return redirect()->route('teachers.index')->with('success', 'Profesor creado correctamente.');
    }

    public function edit(Teacher $teacher): Response
    {
        $this->authorize('update', $teacher);

        return Inertia::render('Teachers/Edit', [
            'teacher' => $teacher->load('user'),
            'specialties' => Subject::orderBy('name')->pluck('name')->unique()->values(),
        ]);
    }

    public function update(Request $request, Teacher $teacher): RedirectResponse
    {
        $this->authorize('update', $teacher);

        $teacher->update($this->validateTeacher($request, $teacher));

        return redirect()->route('teachers.index')->with('success', 'Profesor actualizado correctamente.');
    }

    public function destroy(Teacher $teacher): RedirectResponse
    {
        $this->authorize('delete', $teacher);

        $teacher->delete();

        return redirect()->route('teachers.index')->with('success', 'Profesor eliminado correctamente.');
    }

    private function validateTeacher(Request $request, ?Teacher $teacher = null): array
    {
        return $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('teachers')->ignore($teacher)],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialty' => ['nullable', 'array'],
            'specialty.*' => ['string', 'max:100'],
        ]);
    }
}
