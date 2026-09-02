<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Carrera;
use App\Models\Cuota;
use App\Models\Enrollment;
use App\Models\Matricula;
use App\Models\Pago;
use App\Models\Student;
use App\Services\BloqueoAccesoService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MatriculaController extends Controller
{
    public function __construct(private readonly BloqueoAccesoService $bloqueos) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Matricula::class);

        $matriculas = Matricula::query()
            ->with(['student', 'carrera', 'cuotas.pagos', 'historiales.user'])
            ->withSum('cuotas as saldo_total', 'monto_programado')
            ->withSum('cuotas as pagado_total', 'monto_pagado')
            ->when($request->string('student_id')->toString(), function ($query, $studentId) {
                $query->where('student_id', $studentId);
            })
            ->when($request->string('carrera_id')->toString(), function ($query, $carreraId) {
                $query->where('carrera_id', $carreraId);
            })
            ->latest('fecha_matricula')
            ->paginate(15)
            ->withQueryString();

        $matriculas->getCollection()->each(function (Matricula $matricula) {
            $matricula->saldo_total = (float) $matricula->saldo_total;
            $matricula->pagado_total = (float) $matricula->pagado_total;
        });

        $this->attachMaterias($matriculas->getCollection());

        return Inertia::render('Matriculas/Index', [
            'matriculas' => $matriculas,
            'filters' => $request->only('student_id', 'carrera_id'),
            'students' => Student::orderBy('last_name')->get(['id', 'first_name', 'last_name', 'document_number', 'carrera_id', 'ciclo', 'turno']),
            'carreras' => Carrera::orderBy('name')->get(['id', 'name', 'total_ciclos']),
            'can' => [
                'create' => $request->user()->can('create', Matricula::class),
                'delete' => $request->user()->hasRole(UserRole::Gerencia),
                'manage' => $request->user()->hasRole(UserRole::Gerencia),
                'registerPayment' => $request->user()->can('create', Pago::class),
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

        DB::transaction(function () use ($validated) {
            $matricula = Matricula::create($validated);

            $matricula->cuotas()->create([
                'tipo' => 'matricula',
                'mes' => null,
                'monto_programado' => $matricula->monto_matricula,
                'monto_pagado' => 0,
                'fecha_vencimiento' => $matricula->fecha_matricula,
                'estado' => 'pendiente',
            ]);

            $matricula->generarCuotasPension($matricula->monto_pension);

            $this->bloqueos->evaluarYDesbloquear($matricula->student);
        });

        return redirect()->route('matriculas.index')->with('success', 'Matrícula registrada correctamente con su plan de 5 cuotas (matrícula + 4 pensiones).');
    }

    public function show(Request $request, Matricula $matricula): Response
    {
        $this->authorize('view', $matricula);

        $matricula->load(['student', 'carrera', 'cuotas.pagos', 'historiales.user']);
        $this->attachMaterias(new Collection([$matricula]));

        return Inertia::render('Matriculas/Show', [
            'matricula' => $matricula,
            'can' => [
                'manage' => $request->user()->can('update', $matricula),
                'registerPayment' => $request->user()->can('create', Pago::class),
            ],
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

        $this->registrarCambios($request, $matricula, [
            'ciclo' => ['Ciclo', (int) $validated['ciclo']],
            'turno' => ['Turno', $validated['turno']],
            'period' => ['Periodo', $validated['period']],
            'monto_matricula' => ['Monto de matrícula', (float) $validated['monto_matricula']],
        ]);

        $matricula->update($validated);

        return back()->with('success', 'Matrícula actualizada correctamente.');
    }

    public function destroy(Matricula $matricula): RedirectResponse
    {
        $this->authorize('delete', $matricula);

        $matricula->delete();

        return redirect()->route('matriculas.index')->with('success', 'Matrícula eliminada correctamente.');
    }

    /**
     * @param  array<string, array{0: string, 1: int|float|string}>  $cambiosPropuestos  campo => [etiqueta, valor nuevo]
     */
    private function registrarCambios(Request $request, Matricula $matricula, array $cambiosPropuestos): void
    {
        foreach ($cambiosPropuestos as $campo => [$etiqueta, $valorNuevo]) {
            $valorAnterior = $matricula->getAttribute($campo);

            if ($valorAnterior == $valorNuevo) {
                continue;
            }

            $matricula->historiales()->create([
                'user_id' => $request->user()->id,
                'campo' => $etiqueta,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $valorNuevo,
            ]);
        }
    }

    /**
     * @param  Collection<int, Matricula>  $matriculas
     */
    private function attachMaterias(Collection $matriculas): void
    {
        $studentIds = $matriculas->pluck('student_id')->unique()->values();

        $enrollmentsByStudent = Enrollment::query()
            ->with(['course.subject', 'course.teacher'])
            ->whereIn('student_id', $studentIds)
            ->where('status', 'active')
            ->get()
            ->groupBy('student_id');

        $matriculas->each(function (Matricula $matricula) use ($enrollmentsByStudent) {
            $matricula->materias = $enrollmentsByStudent
                ->get($matricula->student_id, collect())
                ->filter(fn (Enrollment $enrollment) => $enrollment->course
                    && $enrollment->course->subject
                    && $enrollment->course->subject->carrera_id === $matricula->carrera_id
                    && $enrollment->course->subject->ciclo === $matricula->ciclo)
                ->map(fn (Enrollment $enrollment) => [
                    'enrollment_id' => $enrollment->id,
                    'course_id' => $enrollment->course_id,
                    'subject' => $enrollment->course->subject->name,
                    'course' => $enrollment->course->name,
                    'teacher' => $enrollment->course->teacher
                        ? "{$enrollment->course->teacher->first_name} {$enrollment->course->teacher->last_name}"
                        : null,
                ])
                ->sortBy('subject')
                ->values();
        });
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
            'monto_pension' => ['required', 'numeric', 'min:0'],
            'fecha_matricula' => ['required', 'date'],
        ]);

        $validated['estado'] = 'pendiente';

        return $validated;
    }
}
