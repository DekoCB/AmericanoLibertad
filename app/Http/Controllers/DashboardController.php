<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Horario;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Coordenadas de Huaraz, Áncash (sede del instituto).
     */
    private const CLIMA_LATITUD = -9.5277;

    private const CLIMA_LONGITUD = -77.5278;

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === UserRole::Docente) {
            return $this->docenteDashboard($user);
        }

        if ($user->role === UserRole::Estudiante) {
            return $this->estudianteDashboard($user);
        }

        return $this->staffDashboard();
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

    private function staffDashboard(): Response
    {
        return Inertia::render('Dashboard', [
            'view' => 'staff',
            'clima' => $this->clima(),
            'stats' => [
                'students' => Student::count(),
                'activeStudents' => Student::where('status', 'active')->count(),
                'teachers' => Teacher::count(),
                'subjects' => Subject::count(),
                'courses' => Course::count(),
                'activeEnrollments' => Enrollment::where('status', 'active')->count(),
                'averageScore' => round((float) Grade::avg('score'), 1),
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
