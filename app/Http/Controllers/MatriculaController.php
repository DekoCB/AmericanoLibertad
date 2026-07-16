<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Carrera;
use App\Models\Cuota;
use App\Models\Matricula;
use App\Models\Pago;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MatriculaController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Matricula::class);

        $matriculas = Matricula::query()
            ->with(['student', 'carrera'])
            ->withSum('cuotas as saldo_total', 'monto_programado')
            ->withSum('cuotas as pagado_total', 'monto_pagado')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->whereHas('student', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%"));
            })
            ->latest('fecha_matricula')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Matriculas/Index', [
            'matriculas' => $matriculas,
            'filters' => $request->only('search'),
            'can' => [
                'create' => $request->user()->can('create', Matricula::class),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Matricula::class);

        return Inertia::render('Matriculas/Create', [
            'students' => Student::orderBy('last_name')->get(['id', 'first_name', 'last_name', 'carrera_id', 'ciclo', 'turno']),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Matricula::class);

        $validated = $this->validateMatricula($request);

        $matricula = Matricula::create($validated);

        $matricula->cuotas()->create([
            'tipo' => 'matricula',
            'mes' => null,
            'monto_programado' => $matricula->monto_matricula,
            'monto_pagado' => 0,
            'fecha_vencimiento' => $matricula->fecha_matricula,
            'estado' => 'pendiente',
        ]);

        return redirect()->route('matriculas.show', $matricula)->with('success', 'Matrícula registrada correctamente.');
    }

    public function show(Request $request, Matricula $matricula): Response
    {
        $this->authorize('view', $matricula);

        $matricula->load(['student', 'carrera', 'cuotas.pagos']);

        return Inertia::render('Matriculas/Show', [
            'matricula' => $matricula,
            'can' => [
                'manage' => $request->user()->can('update', $matricula),
                'registerPayment' => $request->user()->can('create', Pago::class),
            ],
        ]);
    }

    public function edit(Matricula $matricula): Response
    {
        $this->authorize('update', $matricula);

        return Inertia::render('Matriculas/Edit', [
            'matricula' => $matricula,
        ]);
    }

    public function update(Request $request, Matricula $matricula): RedirectResponse
    {
        $this->authorize('update', $matricula);

        $validated = $request->validate([
            'ciclo' => ['required', 'integer', 'min:1', 'max:20'],
            'turno' => ['required', Rule::in(['mañana', 'tarde', 'noche'])],
            'period' => ['required', 'string', 'max:20'],
            'monto_matricula' => ['required', 'numeric', 'min:0'],
        ]);

        $matricula->update($validated);

        return redirect()->route('matriculas.show', $matricula)->with('success', 'Matrícula actualizada correctamente.');
    }

    public function destroy(Matricula $matricula): RedirectResponse
    {
        $this->authorize('delete', $matricula);

        $matricula->delete();

        return redirect()->route('matriculas.index')->with('success', 'Matrícula eliminada correctamente.');
    }

    private function validateMatricula(Request $request): array
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'carrera_id' => ['required', 'exists:carreras,id'],
            'ciclo' => ['required', 'integer', 'min:1', 'max:20'],
            'turno' => ['required', Rule::in(['mañana', 'tarde', 'noche'])],
            'period' => ['required', 'string', 'max:20'],
            'monto_matricula' => ['required', 'numeric', 'min:0'],
            'fecha_matricula' => ['required', 'date'],
        ]);

        $validated['estado'] = 'pendiente';

        return $validated;
    }
}
