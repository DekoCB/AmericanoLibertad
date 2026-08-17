<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\IngresoManual;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IngresoManualController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', IngresoManual::class);

        $ingresos = IngresoManual::query()
            ->with('registradoPor')
            ->latest('fecha')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('IngresosManuales/Index', [
            'ingresos' => $ingresos,
            'can' => [
                'create' => $request->user()->can('create', IngresoManual::class),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', IngresoManual::class);

        IngresoManual::create([
            ...$this->validateIngreso($request),
            'registrado_por' => $request->user()->id,
        ]);

        return back()->with('success', 'Ingreso registrado correctamente.');
    }

    public function destroy(IngresoManual $ingresoManual): RedirectResponse
    {
        $this->authorize('delete', $ingresoManual);

        $ingresoManual->delete();

        return redirect()->route('ingresos-manuales.index')->with('success', 'Ingreso eliminado correctamente.');
    }

    private function validateIngreso(Request $request): array
    {
        return $request->validate([
            'concepto' => ['required', 'string', 'max:150'],
            'categoria' => ['required', Rule::in(['donacion', 'servicio', 'otro'])],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'fecha' => ['required', 'date'],
        ]);
    }
}
