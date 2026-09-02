<?php

namespace App\Console\Commands;

use App\Models\Matricula;
use App\Services\BloqueoAccesoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CompletarCuotasMatriculas extends Command
{
    protected $signature = 'matriculas:completar-cuotas {--monto=150 : Monto de pensión a usar para las matrículas que no tengan uno definido}';

    protected $description = 'Completa el plan de 5 cuotas (matrícula + 4 pensiones) en matrículas existentes que no lo tengan';

    public function handle(BloqueoAccesoService $bloqueos): int
    {
        $montoPorDefecto = (float) $this->option('monto');

        $matriculas = Matricula::query()
            ->with('student')
            ->withCount(['cuotas as pension_count' => fn ($q) => $q->where('tipo', 'pension')])
            ->having('pension_count', '<', 4)
            ->get();

        if ($matriculas->isEmpty()) {
            $this->info('No hay matrículas pendientes de completar: todas ya tienen su plan de 5 cuotas.');

            return self::SUCCESS;
        }

        $matriculasActualizadas = 0;
        $cuotasCreadas = 0;

        DB::transaction(function () use ($matriculas, $montoPorDefecto, $bloqueos, &$matriculasActualizadas, &$cuotasCreadas) {
            foreach ($matriculas as $matricula) {
                $montoPension = $matricula->monto_pension ?: $montoPorDefecto;

                if (! $matricula->monto_pension) {
                    $matricula->update(['monto_pension' => $montoPension]);
                }

                $creadas = $matricula->generarCuotasPension($montoPension);

                if ($creadas > 0) {
                    $matriculasActualizadas++;
                    $cuotasCreadas += $creadas;

                    if ($matricula->student) {
                        $bloqueos->evaluarYDesbloquear($matricula->student);
                    }
                }
            }
        });

        $this->info("Listo: {$matriculasActualizadas} matrícula(s) actualizadas, {$cuotasCreadas} cuota(s) de pensión creadas.");

        return self::SUCCESS;
    }
}
