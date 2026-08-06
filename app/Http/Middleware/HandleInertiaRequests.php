<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\AdmissionApplication;
use App\Models\Carrera;
use App\Models\Course;
use App\Models\Egreso;
use App\Models\Matricula;
use App\Models\PermisoDocente;
use App\Models\RegistroHoras;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'nav' => $user ? [
                    'students' => $user->can('viewAny', Student::class),
                    'teachers' => $user->can('viewAny', Teacher::class),
                    'subjects' => $user->can('viewAny', Subject::class),
                    'courses' => $user->can('viewAny', Course::class),
                    'carreras' => $user->can('viewAny', Carrera::class) && $user->role !== UserRole::Estudiante,
                    'admisiones' => $user->can('viewAny', AdmissionApplication::class),
                    'matriculas' => $user->can('viewAny', Matricula::class),
                    'caja' => $user->can('viewAny', Egreso::class),
                    'reportes' => $user->can('viewAny', Egreso::class),
                    'notas' => $user->hasRole(
                        UserRole::Docente,
                        UserRole::Gerencia,
                        UserRole::Coordinador,
                        UserRole::Academico,
                    ),
                    'horarios' => $user->can('viewAny', Course::class) || $user->role === UserRole::Estudiante,
                    'asistencias' => $user->can('viewAny', Course::class) || $user->role === UserRole::Estudiante,
                    'aulaVirtual' => true,
                    'registrosHoras' => $user->can('viewAny', RegistroHoras::class),
                    'permisos' => $user->can('viewAny', PermisoDocente::class),
                    'users' => $user->role === UserRole::Gerencia,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
