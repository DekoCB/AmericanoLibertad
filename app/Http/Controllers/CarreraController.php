<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CarreraController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Carrera::class);

        $carreras = Carrera::query()
            ->withCount(['students', 'subjects'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Carreras/Index', [
            'carreras' => $carreras,
            'can' => [
                'create' => $request->user()->can('create', Carrera::class),
                'update' => $request->user()->can('update', new Carrera()),
                'delete' => $request->user()->can('delete', new Carrera()),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Carrera::class);

        return Inertia::render('Carreras/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Carrera::class);

        Carrera::create($this->validateCarrera($request));

        return redirect()->route('carreras.index')->with('success', 'Carrera creada correctamente.');
    }

    public function edit(Carrera $carrera): Response
    {
        $this->authorize('update', $carrera);

        return Inertia::render('Carreras/Edit', [
            'carrera' => $carrera,
        ]);
    }

    public function update(Request $request, Carrera $carrera): RedirectResponse
    {
        $this->authorize('update', $carrera);

        $carrera->update($this->validateCarrera($request, $carrera));

        return redirect()->route('carreras.index')->with('success', 'Carrera actualizada correctamente.');
    }

    public function destroy(Carrera $carrera): RedirectResponse
    {
        $this->authorize('delete', $carrera);

        $carrera->delete();

        return redirect()->route('carreras.index')->with('success', 'Carrera eliminada correctamente.');
    }

    private function validateCarrera(Request $request, ?Carrera $carrera = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:20', Rule::unique('carreras')->ignore($carrera)],
            'total_ciclos' => ['required', 'integer', 'min:1', 'max:20'],
        ]);
    }
}
