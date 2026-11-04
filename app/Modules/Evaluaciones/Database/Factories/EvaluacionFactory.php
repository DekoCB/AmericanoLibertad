<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Database\Factories;

use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Evaluaciones\Models\Evaluacion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evaluacion>
 */
class EvaluacionFactory extends Factory
{
    protected $model = Evaluacion::class;

    public function definition(): array
    {
        return [
            'horario_id' => Horario::factory(),
            'tipo' => TipoEvaluacionEnum::CONTINUA,
            'mitad' => MitadCicloEnum::PRIMERA,
            'nombre' => 'C1',
            'fecha' => now()->format('Y-m-d'),
            'estado' => EstadoEvaluacionEnum::BORRADOR,
        ];
    }

    public function publicada(): static
    {
        return $this->state(['estado' => EstadoEvaluacionEnum::PUBLICADA]);
    }

    public function tipo(TipoEvaluacionEnum $tipo): static
    {
        return $this->state(['tipo' => $tipo]);
    }

    public function mitad(MitadCicloEnum $mitad): static
    {
        return $this->state(['mitad' => $mitad]);
    }

    public function examen(): static
    {
        return $this->state(['tipo' => TipoEvaluacionEnum::EXAMEN, 'nombre' => null]);
    }
}
