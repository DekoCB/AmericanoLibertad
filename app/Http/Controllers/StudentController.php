<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Student::class);

        $students = Student::query()
            ->with(['carrera', 'user'])
            ->when($request->string('student_id')->toString(), function ($query, $studentId) {
                $query->where('id', $studentId);
            })
            ->when($request->string('carrera_id')->toString(), function ($query, $carreraId) {
                $query->where('carrera_id', $carreraId);
            })
            ->withCount('enrollments')
            ->orderBy('ciclo')
            ->orderBy('turno')
            ->orderBy('last_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'allStudents' => Student::orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'email', 'document_number']),
            'filters' => $request->only(['student_id', 'carrera_id']),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
            'can' => [
                'create' => $request->user()->can('create', Student::class),
                'update' => $request->user()->can('update', new Student()),
                'delete' => $request->user()->can('delete', new Student()),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Student::class);

        return Inertia::render('Students/Create', [
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Student::class);

        Student::create($this->validateStudent($request));

        return redirect()->route('students.index')->with('success', 'Estudiante creado correctamente.');
    }

    public function edit(Student $student): Response
    {
        $this->authorize('update', $student);

        return Inertia::render('Students/Edit', [
            'student' => $student->load('user'),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $this->authorize('update', $student);

        $student->update($this->validateStudent($request, $student));

        return redirect()->route('students.index')->with('success', 'Estudiante actualizado correctamente.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $this->authorize('delete', $student);

        $student->delete();

        return redirect()->route('students.index')->with('success', 'Estudiante eliminado correctamente.');
    }

    private function validateStudent(Request $request, ?Student $student = null): array
    {
        return $request->validate([
            'document_number' => ['required', 'string', 'max:20', Rule::unique('students')->ignore($student)],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('students')->ignore($student)],
            'phone' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'inactive', 'graduated'])],
            'carrera_id' => ['nullable', 'exists:carreras,id'],
            'ciclo' => ['nullable', 'integer', 'min:1', 'max:20'],
            'turno' => ['nullable', Rule::in(['mañana', 'tarde', 'noche'])],
        ]);
    }
}
