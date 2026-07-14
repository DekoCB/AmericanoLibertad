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
        $subjects = Subject::query()
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->withCount('courses')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Subjects/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        Subject::create($this->validateSubject($request));

        return redirect()->route('subjects.index')->with('success', 'Materia creada correctamente.');
    }

    public function edit(Subject $subject): Response
    {
        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $subject->update($this->validateSubject($request, $subject));

        return redirect()->route('subjects.index')->with('success', 'Materia actualizada correctamente.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
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
