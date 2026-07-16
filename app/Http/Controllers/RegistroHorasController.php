<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Egreso;
use App\Models\RegistroHoras;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistroHorasController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', RegistroHoras::class);

        $user = $request->user();

        $registros = RegistroHoras::query()
            ->with(['teacher', 'course.subject'])
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->when($request->integer('teacher_id'), fn ($query, $teacherId) => $query->where('teacher_id', $teacherId))
            ->latest('fecha')
            ->paginate(20)
            ->withQueryString();

        $registros->getCollection()->transform(function (RegistroHoras $registro) {
            $registro->monto_bruto = $registro->montoBruto();
            $registro->descuento_tardanza = $registro->descuentoTardanza();
            $registro->monto_neto = $registro->montoNeto();

            return $registro;
        });

        $pendientesPorDocente = RegistroHoras::query()
            ->with('teacher')
            ->where('pagado', false)
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->get()
            ->groupBy('teacher_id')
            ->map(function ($registros) {
                $teacher = $registros->first()->teacher;

                return [
                    'teacher' => $teacher,
                    'horas' => $registros->sum('horas_academicas'),
                    'monto_neto' => $registros->sum(fn (RegistroHoras $r) => $r->montoNeto()),
                ];
            })
            ->values();

        return Inertia::render('RegistroHoras/Index', [
            'registros' => $registros,
            'pendientesPorDocente' => $pendientesPorDocente,
            'teachers' => $user->hasRole(UserRole::Docente) ? [] : Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'courses' => $user->hasRole(UserRole::Docente)
                ? Course::where('teacher_id', $user->teacher_id)->get(['id', 'name'])
                : Course::orderByDesc('period')->get(['id', 'name']),
            'filters' => $request->only('teacher_id'),
            'can' => [
                'generarPago' => $user->can('generarPago', RegistroHoras::class),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isDocente = $user->hasRole(UserRole::Docente);

        $validated = $request->validate([
            'teacher_id' => [$isDocente ? 'nullable' : 'required', 'exists:teachers,id'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'fecha' => ['required', 'date'],
            'horas_academicas' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'minutos_tardanza' => ['nullable', 'integer', 'min:0', 'max:600'],
            'nota' => ['nullable', 'string', 'max:500'],
        ]);

        $teacherId = $isDocente ? $user->teacher_id : $validated['teacher_id'];

        $teacher = Teacher::findOrFail($teacherId);

        $this->authorize('create', [RegistroHoras::class, $teacher]);

        RegistroHoras::create([
            ...$validated,
            'teacher_id' => $teacherId,
            'minutos_tardanza' => $validated['minutos_tardanza'] ?? 0,
        ]);

        return redirect()->route('registros-horas.index')->with('success', 'Registro de horas guardado correctamente.');
    }

    public function destroy(RegistroHoras $registroHora): RedirectResponse
    {
        $this->authorize('delete', $registroHora);

        $registroHora->delete();

        return redirect()->route('registros-horas.index')->with('success', 'Registro eliminado correctamente.');
    }

    public function generarPago(Request $request): RedirectResponse
    {
        $this->authorize('generarPago', RegistroHoras::class);

        $validated = $request->validate([
            'teacher_id' => ['required', 'exists:teachers,id'],
            'desde' => ['required', 'date'],
            'hasta' => ['required', 'date', 'after_or_equal:desde'],
        ]);

        $teacher = Teacher::findOrFail($validated['teacher_id']);

        $registros = RegistroHoras::where('teacher_id', $teacher->id)
            ->where('pagado', false)
            ->whereBetween('fecha', [$validated['desde'], $validated['hasta']])
            ->get();

        if ($registros->isEmpty()) {
            return redirect()->back()->with('error', 'No hay horas pendientes de pago en ese rango de fechas.');
        }

        $montoNeto = $registros->sum(fn (RegistroHoras $r) => $r->montoNeto());

        $egreso = Egreso::create([
            'concepto' => "Pago docente: {$teacher->first_name} {$teacher->last_name} ({$validated['desde']} a {$validated['hasta']})",
            'categoria' => 'pago_docente',
            'monto' => $montoNeto,
            'fecha' => now()->toDateString(),
            'registrado_por' => $request->user()->id,
        ]);

        RegistroHoras::whereIn('id', $registros->pluck('id'))->update([
            'pagado' => true,
            'egreso_id' => $egreso->id,
        ]);

        return redirect()->route('registros-horas.index')->with('success', 'Pago generado correctamente por S/ '.number_format($montoNeto, 2).'.');
    }
}
