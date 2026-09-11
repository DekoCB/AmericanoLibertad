<?php

declare(strict_types=1);

namespace App\Modules\Academico\Database\Seeders;

use App\Modules\Academico\Enums\EstadoCicloEnum;
use App\Modules\Academico\Enums\TipoCicloEnum;
use App\Modules\Academico\Models\Aula;
use App\Modules\Academico\Models\Ciclo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Ya no crea Grado/Curso-de-grado/Horario de demo (el modelo Grado, heredado
 * de CEBA, está en retirada -- ver el plan de migración Grado->Carrera+Ciclo).
 * Solo siembra el Ciclo/Aula/periodo de matrícula activos, que no
 * dependen de Grado y los sigue necesitando el resto del sistema para tener
 * un periodo de matrícula abierto en desarrollo.
 */
class AcademicoDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Los 4 ciclos rotativos del año, cada uno con su propia Aula A y
        // Aula B (libres, sin sección fija asignada). El "activo" para la
        // demo es el que ya empezó más recientemente sin pasarse de hoy,
        // para que haya datos con los que probar el resto de módulos desde
        // ya.
        $hoy = now();
        $anio = (int) $hoy->format('Y');

        $ventanas = collect(TipoCicloEnum::cases())->mapWithKeys(function (TipoCicloEnum $tipo) use ($anio) {
            $inicio = Carbon::create($anio, $tipo->mesInicioFijo(), 1);
            $fin = $inicio->copy()->addMonths($tipo->duracionEnMeses())->subDay();

            return [$tipo->value => ['tipo' => $tipo, 'inicio' => $inicio, 'fin' => $fin]];
        });

        $tipoActivo = $ventanas
            ->filter(fn (array $datos) => $datos['inicio']->lessThanOrEqualTo($hoy))
            ->sortByDesc(fn (array $datos) => $datos['inicio'])
            ->first()['tipo'] ?? TipoCicloEnum::CICLO_1;

        $grupos = $ventanas->map(function (array $datos) use ($tipoActivo) {
            $ciclo = Ciclo::query()->create([
                'nombre' => $datos['tipo']->label(),
                'tipo' => $datos['tipo'],
                'anio' => $datos['inicio']->year,
                'fecha_inicio' => $datos['inicio']->toDateString(),
                'fecha_fin' => $datos['fin']->toDateString(),
                'estado' => $datos['tipo'] === $tipoActivo ? EstadoCicloEnum::ACTIVO : EstadoCicloEnum::PLANIFICADO,
            ]);

            $aulaA = Aula::query()->create([
                'ciclo_id' => $ciclo->id,
                'letra' => 'A',
                'nombre' => "Aula A. {$ciclo->nombre}",
                'capacidad' => 30,
                'ubicacion' => 'Piso 1',
            ]);

            $aulaB = Aula::query()->create([
                'ciclo_id' => $ciclo->id,
                'letra' => 'B',
                'nombre' => "Aula B. {$ciclo->nombre}",
                'capacidad' => 25,
                'ubicacion' => 'Piso 1',
            ]);

            return ['ciclo' => $ciclo, 'aulaA' => $aulaA, 'aulaB' => $aulaB];
        });

        $ciclo = $grupos[$tipoActivo->value]['ciclo'];

        // Centrado en "hoy" (no en el inicio del ciclo) para que el periodo
        // quede abierto sin importar en qué punto del ciclo se corra el seeder.
        $ciclo->periodosMatricula()->create([
            'fecha_inicio' => now()->subDays(10),
            'fecha_fin' => now()->addDays(20),
        ]);
    }
}
