<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Subject::class);

        $subjects = Subject::query()
            ->when($request->string('name')->toString(), function ($query, $name) {
                $query->where('name', $name);
            })
            ->with('carrera')
            ->withCount('courses')
            ->orderBy('name')
            ->orderBy('ciclo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Subjects/Index', [
            'subjects' => $subjects,
            'nombresMaterias' => Subject::orderBy('name')->distinct()->pluck('name'),
            'filters' => $request->only('name'),
            'can' => [
                'create' => $request->user()->can('create', Subject::class),
                'update' => $request->user()->can('update', new Subject()),
                'delete' => $request->user()->can('delete', new Subject()),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Subject::class);

        return Inertia::render('Subjects/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Subject::class);

        Subject::create($this->validateSubject($request));

        return redirect()->route('subjects.index')->with('success', 'Materia creada correctamente.');
    }

    public function edit(Subject $subject): Response
    {
        $this->authorize('update', $subject);

        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorize('update', $subject);

        $subject->update($this->validateSubject($request, $subject));

        return redirect()->route('subjects.index')->with('success', 'Materia actualizada correctamente.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $this->authorize('delete', $subject);

        $subject->delete();

        return redirect()->route('subjects.index')->with('success', 'Materia eliminada correctamente.');
    }

    private function validateSubject(Request $request, ?Subject $subject = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:20', Rule::unique('subjects')->ignore($subject)],
            'description' => ['nullable', 'string', 'max:1000'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:20'],
        ]);
    }
}
