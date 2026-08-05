<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Egreso;
use App\Models\RegistroHoras;
use App\Models\Teacher;
use App\Support\NumeroALetras;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
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
                    'registros' => $registros->map(fn (RegistroHoras $r) => [
                        'fecha' => $r->fecha->format('Y-m-d'),
                        'horas_academicas' => (float) $r->horas_academicas,
                        'monto_neto' => $r->montoNeto(),
                    ])->values(),
                ];
            })
            ->values();

        return Inertia::render('RegistroHoras/Index', [
            'registros' => $registros,
            'pendientesPorDocente' => $pendientesPorDocente,
            'teachers' => $user->hasRole(UserRole::Docente) ? [] : Teacher::orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'courses' => Course::with('subject:id,name,ciclo')
                ->when(
                    $user->hasRole(UserRole::Docente),
                    fn ($query) => $query->where('teacher_id', $user->teacher_id)
                )
                ->orderBy('name')
                ->get(['id', 'name', 'subject_id', 'teacher_id']),
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

    public function comprobante(Request $request, Egreso $egreso): View
    {
        abort_unless($egreso->categoria === 'pago_docente', 404);

        $registros = $egreso->registrosHoras()
            ->with(['teacher', 'course.subject'])
            ->orderBy('fecha')
            ->get();

        abort_if($registros->isEmpty(), 404);

        $teacher = $registros->first()->teacher;
        $user = $request->user();

        $esSuPropioDocente = $user->hasRole(UserRole::Docente) && $user->teacher_id === $teacher->id;
        $esPersonalAdministrativo = $user->hasRole(UserRole::Gerencia, UserRole::Administrativo, UserRole::Coordinador);

        abort_unless($esSuPropioDocente || $esPersonalAdministrativo, 403);

        $filas = $registros->map(fn (RegistroHoras $r) => [
            'fecha' => $r->fecha->format('d/m/Y'),
            'curso' => $r->course?->name,
            'horas' => (float) $r->horas_academicas,
            'monto_bruto' => $r->montoBruto(),
            'descuento_tardanza' => $r->descuentoTardanza(),
            'monto_neto' => $r->montoNeto(),
        ]);

        $totalNeto = $filas->sum('monto_neto');

        return view('comprobantes.pago-docente', [
            'egreso' => $egreso,
            'teacher' => $teacher,
            'filas' => $filas,
            'desde' => $registros->min('fecha')->format('d/m/Y'),
            'hasta' => $registros->max('fecha')->format('d/m/Y'),
            'totalHoras' => $filas->sum('horas'),
            'totalBruto' => $filas->sum('monto_bruto'),
            'totalDescuento' => $filas->sum('descuento_tardanza'),
            'totalNeto' => $totalNeto,
            'numeroBoleta' => 'P001-' . str_pad((string) $egreso->id, 8, '0', STR_PAD_LEFT),
            'montoEnLetras' => NumeroALetras::convertir((float) $totalNeto),
        ]);
    }
}
