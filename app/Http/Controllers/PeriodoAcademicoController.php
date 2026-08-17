<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\PeriodoAcademico;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PeriodoAcademicoController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PeriodoAcademico::class);

        return Inertia::render('PeriodosAcademicos/Index', [
            'periodos' => PeriodoAcademico::withCount(['courses', 'matriculas'])
                ->orderByDesc('fecha_inicio')
                ->get(),
            'can' => [
                'create' => $request->user()->can('create', PeriodoAcademico::class),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', PeriodoAcademico::class);

        PeriodoAcademico::create($this->validatePeriodo($request));

        return back()->with('success', 'Período académico creado correctamente.');
    }

    public function update(Request $request, PeriodoAcademico $periodoAcademico): RedirectResponse
    {
        $this->authorize('update', $periodoAcademico);

        $validated = $this->validatePeriodo($request, $periodoAcademico);

        $periodoAcademico->update($validated);

        $fueraDeRango = Evaluation::whereHas(
            'course',
            fn ($q) => $q->where('periodo_academico_id', $periodoAcademico->id),
        )
            ->where(function ($q) use ($validated) {
                $q->whereDate('date', '<', $validated['fecha_inicio'])
                    ->orWhereDate('date', '>', $validated['fecha_fin']);
            })
            ->count();

        $mensaje = 'Período actualizado correctamente.';

        if ($fueraDeRango > 0) {
            $mensaje .= " Aviso: {$fueraDeRango} evaluación(es) de este período tienen fecha fuera del nuevo rango — revísalas manualmente si corresponde.";
        }

        return back()->with('success', $mensaje);
    }

    public function destroy(PeriodoAcademico $periodoAcademico): RedirectResponse
    {
        $this->authorize('delete', $periodoAcademico);

        $periodoAcademico->delete();

        return back()->with('success', 'Período académico eliminado correctamente.');
    }

    private function validatePeriodo(Request $request, ?PeriodoAcademico $periodo = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:20', Rule::unique('periodos_academicos', 'nombre')->ignore($periodo)],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after:fecha_inicio'],
            'activo' => ['boolean'],
        ]);
    }
}
