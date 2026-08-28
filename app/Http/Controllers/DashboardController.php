<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Egreso;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Horario;
use App\Models\IngresoManual;
use App\Models\Pago;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Coordenadas de Tumán, Chiclayo, Lambayeque (sede del instituto).
     */
    private const CLIMA_LATITUD = -6.7418;

    private const CLIMA_LONGITUD = -79.7007;

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === UserRole::Docente) {
            return $this->docenteDashboard($user);
        }

        if ($user->role === UserRole::Estudiante) {
            return $this->estudianteDashboard($user);
        }

        return $this->staffDashboard($request, $user);
    }

    private function clima(): ?array
    {
        return Cache::remember('dashboard-clima', now()->addMinutes(20), function () {
            try {
                $response = Http::timeout(4)->get('https://api.open-meteo.com/v1/forecast', [
                    'latitude' => self::CLIMA_LATITUD,
                    'longitude' => self::CLIMA_LONGITUD,
                    'current' => 'temperature_2m,weather_code,is_day',
                    'timezone' => 'America/Lima',
                ]);

                if (! $response->successful()) {
                    return null;
                }

                $current = $response->json('current');

                if (! $current) {
                    return null;
                }

                $codigo = (int) $current['weather_code'];

                return [
                    'temperatura' => (int) round($current['temperature_2m']),
                    'descripcion' => $this->descripcionClima($codigo),
                    'categoria' => $this->categoriaClima($codigo),
                    'esDeDia' => (bool) $current['is_day'],
                ];
            } catch (\Throwable) {
                return null;
            }
        });
    }

    private function descripcionClima(int $codigo): string
    {
        return match (true) {
            $codigo === 0 => 'Despejado',
            in_array($codigo, [1, 2], true) => 'Parcialmente nublado',
            $codigo === 3 => 'Nublado',
            in_array($codigo, [45, 48], true) => 'Neblina',
            in_array($codigo, [51, 53, 55, 56, 57], true) => 'Llovizna',
            in_array($codigo, [61, 63, 66], true) => 'Lluvia ligera',
            in_array($codigo, [65, 67, 80, 81, 82], true) => 'Lluvia',
            in_array($codigo, [71, 73, 75, 77, 85, 86], true) => 'Nevada',
            $codigo === 95 => 'Tormenta eléctrica',
            in_array($codigo, [96, 99], true) => 'Tormenta con granizo',
            default => 'Clima variable',
        };
    }

    private function categoriaClima(int $codigo): string
    {
        return match (true) {
            $codigo === 0 => 'despejado',
            in_array($codigo, [1, 2, 3], true) => 'nublado',
            in_array($codigo, [45, 48], true) => 'neblina',
            in_array($codigo, [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], true) => 'lluvia',
            in_array($codigo, [71, 73, 75, 77, 85, 86], true) => 'nieve',
            in_array($codigo, [95, 96, 99], true) => 'granizo',
            default => 'nublado',
        };
    }

    private function estudiantesPorCarrera(): Collection
    {
        return DB::table('students')
            ->join('carreras', 'carreras.id', '=', 'students.carrera_id')
            ->where('students.status', 'active')
            ->selectRaw('carreras.name as carrera, count(*) as total')
            ->groupBy('carreras.id', 'carreras.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($fila) => [
                'carrera' => $fila->carrera,
                'total' => (int) $fila->total,
            ])
            ->values();
    }

    private function promedioPorPeriodo(): Collection
    {
        return DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->join('courses', 'courses.id', '=', 'evaluations.course_id')
            ->selectRaw('courses.period as periodo, AVG(grades.score) as promedio')
            ->groupBy('courses.period')
            ->orderBy('courses.period')
            ->get()
            ->map(fn ($fila) => [
                'periodo' => $fila->periodo,
                'promedio' => round((float) $fila->promedio, 1),
            ]);
    }

    private function balancePorMes(): Collection
    {
        $mesExpr = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', fecha)"
            : "DATE_FORMAT(fecha, '%Y-%m')";

        $pagosPorMes = Pago::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $ingresosManualesPorMes = IngresoManual::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $egresosPorMes = Egreso::query()
            ->selectRaw("{$mesExpr} as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->keyBy('mes');

        $meses = $pagosPorMes->keys()
            ->merge($ingresosManualesPorMes->keys())
            ->merge($egresosPorMes->keys())
            ->unique()
            ->sort()
            ->values();

        return $meses->map(fn ($mes) => [
            'mes' => $mes,
            'ingresos' => (float) ($pagosPorMes[$mes]->total ?? 0) + (float) ($ingresosManualesPorMes[$mes]->total ?? 0),
            'egresos' => (float) ($egresosPorMes[$mes]->total ?? 0),
        ]);
    }

    private function cobrosPorMetodo(): Collection
    {
        $inicioMes = now()->startOfMonth()->toDateString();

        $totales = Pago::where('fecha', '>=', $inicioMes)
            ->selectRaw('medio, SUM(monto) as total')
            ->groupBy('medio')
            ->pluck('total', 'medio');

        return collect(['efectivo', 'yape', 'plin', 'tarjeta'])
            ->map(fn ($medio) => [
                'medio' => $medio,
                'total' => round((float) ($totales[$medio] ?? 0), 2),
            ]);
    }

    private function deudores(int $page): LengthAwarePaginator
    {
        return DB::table('cuotas')
            ->join('matriculas', 'matriculas.id', '=', 'cuotas.matricula_id')
            ->join('students', 'students.id', '=', 'matriculas.student_id')
            ->whereIn('cuotas.estado', ['pendiente', 'parcial', 'vencido'])
            ->selectRaw(
                'students.id as student_id, students.first_name, students.last_name, '
                . 'SUM(cuotas.monto_programado - cuotas.monto_pagado) as deuda, '
                . 'COUNT(cuotas.id) as cuotas_pendientes, '
                . 'MIN(cuotas.fecha_vencimiento) as vencimiento_mas_antiguo'
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name')
            ->orderByDesc('deuda')
            ->paginate(5, ['*'], 'deudores_page', $page)
            ->through(fn ($fila) => [
                'student_id' => (int) $fila->student_id,
                'first_name' => $fila->first_name,
                'last_name' => $fila->last_name,
                'deuda' => round((float) $fila->deuda, 2),
                'cuotas_pendientes' => (int) $fila->cuotas_pendientes,
                'vencimiento_mas_antiguo' => $fila->vencimiento_mas_antiguo,
            ]);
    }

    private function matriculasPorCiclo(): Collection
    {
        return DB::table('enrollments')
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.status', 'active')
            ->whereNotNull('students.ciclo')
            ->selectRaw('students.ciclo as ciclo, count(*) as total')
            ->groupBy('students.ciclo')
            ->orderBy('students.ciclo')
            ->get()
            ->map(fn ($fila) => [
                'ciclo' => (int) $fila->ciclo,
                'total' => (int) $fila->total,
            ]);
    }

    private function staffDashboard(Request $request, User $user): Response
    {
        $canViewFinanzas = $user->can('viewAny', Egreso::class);
        $inicioMes = now()->startOfMonth()->toDateString();
        $deudoresPage = (int) $request->input('deudores_page', 1);

        return Inertia::render('Dashboard', [
            'view' => 'staff',
            'clima' => $this->clima(),
            'canViewFinanzas' => $canViewFinanzas,
            'stats' => [
                'students' => Student::count(),
                'activeStudents' => Student::where('status', 'active')->count(),
                'teachers' => Teacher::count(),
                'subjects' => Subject::count(),
                'courses' => Course::count(),
                'activeEnrollments' => Enrollment::where('status', 'active')->count(),
                'averageScore' => round((float) Grade::avg('score'), 1),
                'balanceMes' => $canViewFinanzas
                    ? (float) Pago::where('fecha', '>=', $inicioMes)->sum('monto')
                        + (float) IngresoManual::where('fecha', '>=', $inicioMes)->sum('monto')
                        - (float) Egreso::where('fecha', '>=', $inicioMes)->sum('monto')
                    : 0,
            ],
            'recentEnrollments' => Enrollment::with(['student.user', 'course.subject'])
                ->latest('enrolled_at')
                ->limit(15)
                ->get(),
            'evaluacionesCalendario' => Evaluation::with('course.subject')
                ->orderBy('date')
                ->get(),
            'estudiantesPorCarrera' => $this->estudiantesPorCarrera(),
            'matriculasPorCiclo' => $this->matriculasPorCiclo(),
            'promedioPorPeriodo' => $this->promedioPorPeriodo(),
            'balancePorMes' => $canViewFinanzas ? $this->balancePorMes() : [],
            'deudores' => $canViewFinanzas ? $this->deudores($deudoresPage) : null,
            'cobrosPorMetodo' => $canViewFinanzas ? $this->cobrosPorMetodo() : [],
        ]);
    }

    private function docenteDashboard(User $user): Response
    {
        $courses = Course::query()
            ->with('subject')
            ->withCount('enrollments')
            ->where('teacher_id', $user->teacher_id)
            ->orderByDesc('period')
            ->get();

        $courseIds = $courses->pluck('id');

        $topEstudiantes = Grade::whereHas('evaluation', fn ($query) => $query->whereIn('course_id', $courseIds))
            ->selectRaw('student_id, AVG(score) as promedio')
            ->groupBy('student_id')
            ->orderByDesc('promedio')
            ->limit(6)
            ->with('student.user')
            ->get()
            ->map(fn ($grade) => [
                'student_id' => $grade->student_id,
                'promedio' => round((float) $grade->promedio, 2),
                'student' => $grade->student,
            ]);

        return Inertia::render('Dashboard', [
            'view' => 'docente',
            'clima' => $this->clima(),
            'stats' => [
                'courses' => $courses->count(),
                'students' => Enrollment::whereIn('course_id', $courseIds)
                    ->where('status', 'active')
                    ->distinct('student_id')
                    ->count('student_id'),
                'evaluations' => Evaluation::whereIn('course_id', $courseIds)->count(),
            ],
            'horarioSemana' => Horario::with('course.subject')
                ->whereIn('course_id', $courseIds)
                ->orderBy('hora_inicio')
                ->get(),
            'topEstudiantes' => $topEstudiantes,
            'evaluacionesCalendario' => Evaluation::with('course.subject')
                ->whereIn('course_id', $courseIds)
                ->orderBy('date')
                ->get(),
        ]);
    }

    private function estudianteDashboard(User $user): Response
    {
        $student = Student::with('carrera')->find($user->student_id);

        $enrollments = Enrollment::with(['course.subject', 'course.teacher'])
            ->where('student_id', $user->student_id)
            ->where('status', 'active')
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $grades = Grade::with('evaluation.course.subject')
            ->where('student_id', $user->student_id)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'view' => 'estudiante',
            'clima' => $this->clima(),
            'stats' => [
                'courses' => $enrollments->count(),
                'averageScore' => round((float) Grade::where('student_id', $user->student_id)->avg('score'), 1),
            ],
            'studentCarrera' => $student?->carrera?->name,
            'myCourses' => $enrollments->pluck('course'),
            'myGrades' => $grades,
            'evaluacionesCalendario' => Evaluation::with('course.subject')
                ->whereIn('course_id', $courseIds)
                ->orderBy('date')
                ->get(),
        ]);
    }
}
