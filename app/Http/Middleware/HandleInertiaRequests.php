<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\AdmissionApplication;
use App\Models\Carrera;
use App\Models\ConfiguracionPago;
use App\Models\Course;
use App\Models\Cuota;
use App\Models\Egreso;
use App\Models\Matricula;
use App\Models\Pago;
use App\Models\PeriodoAcademico;
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
                    'pagos' => $user->can('viewAny', Pago::class),
                    'caja' => $user->can('viewAny', Egreso::class),
                    'reportes' => $user->can('viewAny', Egreso::class),
                    'horarios' => $user->can('viewAny', Course::class) || $user->role === UserRole::Estudiante,
                    'aulaVirtual' => true,
                    'registrosHoras' => $user->can('viewAny', RegistroHoras::class),
                    'permisos' => $user->can('viewAny', PermisoDocente::class),
                    'users' => $user->role === UserRole::Gerencia,
                    'misPagos' => $user->role === UserRole::Estudiante && $user->student_id !== null,
                    'periodosAcademicos' => $user->can('viewAny', PeriodoAcademico::class),
                    'configuracionPagos' => $user->can('view', ConfiguracionPago::class),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'paymentAlert' => fn () => $this->paymentAlert($user),
        ];
    }

    /**
     * @return array{pendientes: int, efectivoPorConfirmar: array<int, array{id: int, monto: float, fecha_limite_pago: string|null}>}|null
     */
    private function paymentAlert($user): ?array
    {
        if (! $user || $user->role !== UserRole::Estudiante || $user->student_id === null) {
            return null;
        }

        $pendientes = Cuota::whereHas(
            'matricula',
            fn ($q) => $q->where('student_id', $user->student_id),
        )->whereIn('estado', ['pendiente', 'vencido', 'parcial'])->count();

        $efectivoPorConfirmar = Pago::where('student_id', $user->student_id)
            ->where('estado', 'pendiente')
            ->where('medio', 'efectivo')
            ->whereNotNull('fecha_limite_pago')
            ->get(['id', 'monto', 'fecha_limite_pago'])
            ->map(fn (Pago $pago) => [
                'id' => $pago->id,
                'monto' => (float) $pago->monto,
                'fecha_limite_pago' => $pago->fecha_limite_pago?->toDateString(),
            ])
            ->all();

        return [
            'pendientes' => $pendientes,
            'efectivoPorConfirmar' => $efectivoPorConfirmar,
        ];
    }
}
