<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Egreso;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EgresoController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Egreso::class);

        $egresos = Egreso::query()
            ->with('registradoPor')
            ->latest('fecha')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Egresos/Index', [
            'egresos' => $egresos,
            'can' => [
                'create' => $request->user()->can('create', Egreso::class),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Egreso::class);

        return Inertia::render('Egresos/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Egreso::class);

        Egreso::create([
            ...$this->validateEgreso($request),
            'registrado_por' => $request->user()->id,
        ]);

        return redirect()->route('egresos.index')->with('success', 'Egreso registrado correctamente.');
    }

    public function destroy(Egreso $egreso): RedirectResponse
    {
        $this->authorize('delete', $egreso);

        $egreso->delete();

        return redirect()->route('egresos.index')->with('success', 'Egreso eliminado correctamente.');
    }

    private function validateEgreso(Request $request): array
    {
        return $request->validate([
            'concepto' => ['required', 'string', 'max:150'],
            'categoria' => ['required', Rule::in(['pago_docente', 'operativo', 'otro'])],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'fecha' => ['required', 'date'],
        ]);
    }
}
