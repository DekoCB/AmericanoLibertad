<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Asistencia;
use App\Models\Course;
use App\Models\EntregaEvaluacion;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\QuizIntento;
use App\Models\RecursoAula;
use App\Models\RecursoVisto;
use App\Models\SemanaContenido;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RecursoAulaController extends Controller
{
    private const TOTAL_SEMANAS = 20;

    public function index(Request $request): Response
    {
        $user = $request->user();

        $courses = Course::query()
            ->with(['subject.carrera', 'teacher'])
            ->withCount('recursosAula')
            ->when(
                $user->hasRole(UserRole::Docente),
                fn ($query) => $query->where('teacher_id', $user->teacher_id)
            )
            ->when(
                $user->hasRole(UserRole::Estudiante),
                fn ($query) => $query->whereHas('enrollments', fn ($q) => $q->where('student_id', $user->student_id))
            )
            ->orderByDesc('period')
            ->orderBy('name')
            ->get();

        $viewMode = match (true) {
            $user->hasRole(UserRole::Estudiante) => 'estudiante',
            $user->hasRole(UserRole::Docente) => 'docente',
            default => 'staff',
        };

        return Inertia::render('AulaVirtual/Index', [
            'courses' => $courses,
            'isStudent' => $user->hasRole(UserRole::Estudiante),
            'viewMode' => $viewMode,
            'canManageImagenes' => $user->hasRole(UserRole::Coordinador, UserRole::Gerencia),
        ]);
    }

    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', [RecursoAula::class, $course]);

        $user = $request->user();
        $isStudent = $user->hasRole(UserRole::Estudiante);

        $semanaParam = $request->query('semana', 'general');
        $semanaActual = $semanaParam === 'general' ? null : (int) $semanaParam;

        // Estado de cada evaluación de la sección desde la perspectiva del estudiante
        // (calificado / entregado / en_progreso / vencido / pendiente), usado para el
        // badge de cada actividad, el indicador de "pendientes" por semana en el menú,
        // y el progreso.
        $estadoPorEvaluacion = [];
        $todasEvaluaciones = collect();

        if ($isStudent && $user->student_id) {
            $todasEvaluaciones = $course->evaluations()
                ->whereNotNull('semana')
                ->get(['id', 'semana', 'date', 'type']);

            $evaluationIds = $todasEvaluaciones->pluck('id');

            $calificadas = Grade::whereIn('evaluation_id', $evaluationIds)
                ->where('student_id', $user->student_id)
                ->pluck('evaluation_id')->all();
            $entregadas = EntregaEvaluacion::whereIn('evaluation_id', $evaluationIds)
                ->where('student_id', $user->student_id)
                ->pluck('evaluation_id')->all();

            $intentosQuiz = QuizIntento::whereIn('evaluation_id', $evaluationIds)
                ->where('student_id', $user->student_id)
                ->get(['evaluation_id', 'enviado_at']);
            $intentosEnviadosPorEvaluacion = $intentosQuiz->whereNotNull('enviado_at')->countBy('evaluation_id');
            $evaluacionesEnProgreso = $intentosQuiz->whereNull('enviado_at')->pluck('evaluation_id')->unique();

            $hoy = now()->toDateString();

            foreach ($todasEvaluaciones as $evaluacion) {
                $enProgreso = $evaluacion->type === 'quiz' && $evaluacionesEnProgreso->contains($evaluacion->id);
                $intentosUsados = $intentosEnviadosPorEvaluacion->get($evaluacion->id, 0);

                $estadoPorEvaluacion[$evaluacion->id] = match (true) {
                    $enProgreso => 'en_progreso',
                    in_array($evaluacion->id, $calificadas, true) => 'calificado',
                    in_array($evaluacion->id, $entregadas, true) || $intentosUsados > 0 => 'entregado',
                    (string) $evaluacion->date < $hoy => 'vencido',
                    default => 'pendiente',
                };
            }
        }

        $semanasPendientes = $todasEvaluaciones
            ->filter(fn ($evaluacion) => in_array($estadoPorEvaluacion[$evaluacion->id] ?? null, ['pendiente', 'vencido'], true))
            ->pluck('semana')
            ->unique()
            ->values();

        $totalEstudiantesActivos = $course->enrollments()->where('status', 'active')->count();

        $evaluaciones = $semanaActual === null
            ? collect()
            : $course->evaluations()
                ->where('semana', $semanaActual)
                ->withCount('grades')
                ->orderBy('date')
                ->get()
                ->map(function ($evaluation) use ($user, $isStudent, $estadoPorEvaluacion, $totalEstudiantesActivos) {
                    $data = $evaluation->toArray();
                    $data['total_estudiantes'] = $totalEstudiantesActivos;

                    if ($evaluation->type === 'quiz') {
                        $data['preguntas_count'] = $evaluation->quizPreguntas()->count();

                        if ($isStudent && $user->student_id) {
                            $data['intentos_usados'] = $evaluation->quizIntentos()
                                ->where('student_id', $user->student_id)
                                ->whereNotNull('enviado_at')
                                ->count();

                            $data['mi_intento'] = $evaluation->quizIntentos()
                                ->where('student_id', $user->student_id)
                                ->whereNotNull('enviado_at')
                                ->orderByDesc('puntaje')
                                ->first();
                        }
                    }

                    if (in_array($evaluation->type, ['homework', 'project'], true) && $isStudent && $user->student_id) {
                        $data['mi_entrega'] = $evaluation->entregas()
                            ->where('student_id', $user->student_id)
                            ->first();
                    }

                    if ($isStudent) {
                        $data['estado'] = $estadoPorEvaluacion[$evaluation->id] ?? 'pendiente';
                    }

                    return $data;
                });

        $recursos = $course->recursosAula()->where('semana', $semanaActual)->latest()->get();

        if ($isStudent && $user->student_id && $recursos->isNotEmpty()) {
            $vistoIds = RecursoVisto::whereIn('recurso_aula_id', $recursos->pluck('id'))
                ->where('student_id', $user->student_id)
                ->pluck('recurso_aula_id')
                ->all();

            $recursos = $recursos->map(function (RecursoAula $recurso) use ($vistoIds) {
                $data = $recurso->toArray();
                $data['visto'] = in_array($recurso->id, $vistoIds, true);

                return $data;
            });
        }

        $progresoSemana = null;

        if ($isStudent && $semanaActual !== null) {
            $totalItems = $evaluaciones->count() + $recursos->count();

            if ($totalItems > 0) {
                $actividadesHechas = $evaluaciones->filter(
                    fn ($e) => in_array($e['estado'] ?? null, ['entregado', 'calificado'], true)
                )->count();
                $materialesRevisados = $recursos->filter(
                    fn ($r) => is_array($r) && ($r['visto'] ?? false)
                )->count();

                $progresoSemana = (int) round(($actividadesHechas + $materialesRevisados) / $totalItems * 100);
            }
        }

        $foroTemas = $semanaActual === null
            ? collect()
            : $course->foroTemas()
                ->where('semana', $semanaActual)
                ->with(['autor:id,name', 'respuestas.user:id,name'])
                ->orderBy('created_at')
                ->get();

        $recursosPorSemana = $course->recursosAula()
            ->selectRaw('semana, count(*) as total')
            ->groupBy('semana')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->semana ?? 'general' => $row->total]);

        $evaluacionesPorSemana = $course->evaluations()
            ->whereNotNull('semana')
            ->selectRaw('semana, count(*) as total')
            ->groupBy('semana')
            ->pluck('total', 'semana');

        $resumenSemanas = collect(['general', ...range(1, self::TOTAL_SEMANAS)])
            ->map(fn ($semana) => [
                'semana' => $semana,
                'total' => ($recursosPorSemana[$semana] ?? 0)
                    + ($semana === 'general' ? 0 : ($evaluacionesPorSemana[$semana] ?? 0)),
                'pendiente' => $semana !== 'general' && $semanasPendientes->contains($semana),
            ]);

        $alertas = $isStudent
            ? $course->recursosAula()
                ->where('entregable', true)
                ->whereNotNull('fecha_entrega')
                ->orderBy('fecha_entrega')
                ->get(['id', 'titulo', 'fecha_entrega', 'semana'])
            : collect();

        $contenidoSemana = $semanaActual !== null
            ? $course->semanaContenidos()->where('semana', $semanaActual)->first()
            : null;

        $canManageAsistencia = $user->can('manage', [Asistencia::class, $course]);
        $canManageEvaluations = $user->can('create', [Evaluation::class, $course]);
        $canManageNotas = $user->can('gradeAny', [Evaluation::class, $course]);

        $fechaAsistencia = $request->query('fecha') ?: now()->toDateString();
        $asistenciaSheet = null;
        $misAsistencias = null;

        if ($canManageAsistencia) {
            $enrollmentsActivos = $course->enrollments()
                ->with('student')
                ->where('status', 'active')
                ->get()
                ->sortBy(fn ($enrollment) => $enrollment->student?->last_name)
                ->values();

            $asistenciasFecha = $course->asistencias()
                ->whereDate('fecha', $fechaAsistencia)
                ->get()
                ->keyBy('student_id');

            $asistenciaSheet = $enrollmentsActivos->map(fn ($enrollment) => [
                'student' => $enrollment->student,
                'asistencia' => $asistenciasFecha->get($enrollment->student_id),
            ]);
        } elseif ($isStudent && $user->student_id) {
            $misAsistencias = $course->asistencias()
                ->where('student_id', $user->student_id)
                ->orderByDesc('fecha')
                ->get();
        }

        $evaluacionesCurso = null;
        $misNotas = null;

        if ($canManageNotas) {
            $totalEstudiantesActivos = $course->enrollments()->where('status', 'active')->count();

            $evaluacionesCurso = $course->evaluations()
                ->withCount('grades')
                ->orderByDesc('date')
                ->get();

            $evaluacionesCurso->each(function (Evaluation $evaluation) use ($totalEstudiantesActivos) {
                $evaluation->total_estudiantes = $totalEstudiantesActivos;
            });
        } elseif ($isStudent && $user->student_id) {
            $misGrades = Grade::whereHas('evaluation', fn ($q) => $q->where('course_id', $course->id))
                ->where('student_id', $user->student_id)
                ->get()
                ->keyBy('evaluation_id');

            $misNotas = $course->evaluations()
                ->orderByDesc('date')
                ->get()
                ->map(function (Evaluation $evaluation) use ($misGrades) {
                    $data = $evaluation->toArray();
                    $data['mi_grade'] = $misGrades->get($evaluation->id);

                    return $data;
                });
        }

        return Inertia::render('AulaVirtual/Show', [
            'course' => $course->load(['subject', 'teacher', 'periodoAcademico']),
            'recursos' => $recursos,
            'evaluaciones' => $evaluaciones,
            'contenidoSemana' => $contenidoSemana,
            'foroTemas' => $foroTemas,
            'progresoSemana' => $progresoSemana,
            'alertas' => $alertas,
            'resumenSemanas' => $resumenSemanas,
            'semanaActual' => $semanaActual,
            'fechaAsistencia' => $fechaAsistencia,
            'asistenciaSheet' => $asistenciaSheet,
            'misAsistencias' => $misAsistencias,
            'evaluacionesCurso' => $evaluacionesCurso,
            'misNotas' => $misNotas,
            'can' => [
                'manage' => $request->user()->can('manage', [RecursoAula::class, $course]),
                'manageEvaluations' => $canManageEvaluations,
                'manageImagen' => $request->user()->can('manageImagen', Subject::class),
                'manageAsistencia' => $canManageAsistencia,
                'manageNotas' => $canManageNotas,
            ],
            'isStudent' => $isStudent,
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        $validated = $request->validate([
            'semana' => ['nullable', 'integer', 'min:1', 'max:' . self::TOTAL_SEMANAS],
            'titulo' => ['required', 'string', 'max:150'],
            'tipo' => ['required', Rule::in(['enlace', 'archivo', 'anuncio', 'texto'])],
            'entregable' => ['boolean'],
            'es_principal' => ['boolean'],
            'es_complementario' => ['boolean'],
            'fecha_entrega' => ['nullable', 'date', 'required_if:entregable,1'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'url' => ['nullable', 'url', 'max:500'],
            'archivo' => ['nullable', 'file', 'max:10240'],
        ]);

        $validated['semana'] = $validated['semana'] !== '' ? $validated['semana'] : null;
        $validated['fecha_entrega'] = $validated['fecha_entrega'] !== '' ? $validated['fecha_entrega'] : null;

        if (! empty($validated['archivo'])) {
            $archivo = $validated['archivo'];
            $validated['archivo_nombre'] = $archivo->getClientOriginalName();
            $validated['archivo'] = $archivo->store('recursos', 'public');
        } else {
            unset($validated['archivo']);
        }

        $course->recursosAula()->create([
            ...$validated,
            'creado_por' => $request->user()->id,
        ]);

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => $validated['semana'] ?? 'general'])
            ->with('success', 'Recurso publicado correctamente.');
    }

    public function updateInfo(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        $validated = $request->validate([
            'objetivo_general' => ['nullable', 'string', 'max:2000'],
            'mensaje_bienvenida' => ['nullable', 'string', 'max:2000'],
            'modalidad' => ['nullable', 'string', 'max:100'],
            'sistema_evaluacion' => ['nullable', 'string', 'max:2000'],
            'requisitos' => ['nullable', 'string', 'max:2000'],
            'competencia_general' => ['nullable', 'string', 'max:2000'],
            'competencias_especificas' => ['nullable', 'string', 'max:2000'],
            'resultados_aprendizaje' => ['nullable', 'string', 'max:2000'],
            'normas_curso' => ['nullable', 'string', 'max:2000'],
        ]);

        $course->update($validated);

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => 'general'])
            ->with('success', 'Información del curso actualizada correctamente.');
    }

    public function updateContenido(Request $request, Course $course, int $semana): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        abort_unless($semana >= 1 && $semana <= self::TOTAL_SEMANAS, 404);

        $validated = $request->validate([
            'titulo' => ['nullable', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'objetivo' => ['nullable', 'string', 'max:2000'],
            'resultados_aprendizaje' => ['nullable', 'string', 'max:2000'],
            'cierre_resumen' => ['nullable', 'string', 'max:2000'],
            'temas' => ['nullable', 'array'],
            'temas.*.titulo' => ['required', 'string', 'max:150'],
            'temas.*.subtemas' => ['nullable', 'array'],
            'temas.*.subtemas.*' => ['string', 'max:300'],
        ]);

        $course->semanaContenidos()->updateOrCreate(
            ['semana' => $semana],
            $validated,
        );

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => $semana])
            ->with('success', 'Contenido de la semana actualizado correctamente.');
    }

    public function toggleVisto(Request $request, RecursoAula $recurso): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->hasRole(UserRole::Estudiante) && $user->student_id, 403);

        $inscrito = $recurso->course->enrollments()
            ->where('student_id', $user->student_id)
            ->exists();

        abort_unless($inscrito, 403);

        $visto = RecursoVisto::where('recurso_aula_id', $recurso->id)
            ->where('student_id', $user->student_id)
            ->first();

        if ($visto) {
            $visto->delete();
        } else {
            RecursoVisto::create([
                'recurso_aula_id' => $recurso->id,
                'student_id' => $user->student_id,
            ]);
        }

        return back();
    }

    public function destroy(Course $course, RecursoAula $recurso): RedirectResponse
    {
        $this->authorize('manage', [RecursoAula::class, $course]);

        if ($recurso->archivo) {
            Storage::disk('public')->delete($recurso->archivo);
        }

        $semana = $recurso->semana ?? 'general';
        $recurso->delete();

        return redirect()
            ->route('aula-virtual.show', ['course' => $course, 'semana' => $semana])
            ->with('success', 'Recurso eliminado correctamente.');
    }
}
