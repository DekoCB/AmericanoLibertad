<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\PermisoDocente;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermisoDocenteController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PermisoDocente::class);

        $user = $request->user();

        $permisos = PermisoDocente::query()
            ->with('teacher')
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->orderByRaw("CASE WHEN estado = 'pendiente' THEN 0 ELSE 1 END")
            ->latest('fecha_inicio')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Permisos/Index', [
            'permisos' => $permisos,
            'teachers' => $user->hasRole(UserRole::Docente) ? [] : Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'can' => [
                'respond' => $user->hasRole(UserRole::Gerencia, UserRole::Administrativo, UserRole::Coordinador),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isDocente = $user->hasRole(UserRole::Docente);

        $validated = $request->validate([
            'teacher_id' => [$isDocente ? 'nullable' : 'required', 'exists:teachers,id'],
            'tipo' => ['required', Rule::in(['permiso', 'licencia', 'vacaciones'])],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'motivo' => ['nullable', 'string', 'max:1000'],
        ]);

        $teacherId = $isDocente ? $user->teacher_id : $validated['teacher_id'];

        $teacher = Teacher::findOrFail($teacherId);

        $this->authorize('create', [PermisoDocente::class, $teacher]);

        PermisoDocente::create([
            ...$validated,
            'teacher_id' => $teacherId,
            'estado' => 'pendiente',
        ]);

        return redirect()->route('permisos.index')->with('success', 'Solicitud registrada correctamente.');
    }

    public function update(Request $request, PermisoDocente $permiso): RedirectResponse
    {
        $this->authorize('update', $permiso);

        $validated = $request->validate([
            'estado' => ['required', Rule::in(['aprobado', 'rechazado'])],
        ]);

        $permiso->update([
            'estado' => $validated['estado'],
            'respondido_por' => $request->user()->id,
        ]);

        return redirect()->route('permisos.index')->with('success', 'Solicitud actualizada correctamente.');
    }

    public function destroy(PermisoDocente $permiso): RedirectResponse
    {
        $this->authorize('delete', $permiso);

        $permiso->delete();

        return redirect()->route('permisos.index')->with('success', 'Solicitud eliminada correctamente.');
    }
}
