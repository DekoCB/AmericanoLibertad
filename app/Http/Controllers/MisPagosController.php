<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\ConfiguracionPago;
use App\Models\Matricula;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MisPagosController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->hasRole(UserRole::Estudiante) && $user->student_id !== null, 403);

        $matriculas = Matricula::where('student_id', $user->student_id)
            ->with(['carrera', 'cuotas.pagos.recibo'])
            ->latest('fecha_matricula')
            ->get();

        $configuracion = ConfiguracionPago::actual();

        return Inertia::render('MisPagos/Index', [
            'matriculas' => $matriculas,
            'configuracionPagos' => $configuracion->only([
                'id', 'yape_numero', 'yape_qr_path', 'plin_numero', 'plin_qr_path', 'cuenta_detalle',
            ]),
        ]);
    }
}
