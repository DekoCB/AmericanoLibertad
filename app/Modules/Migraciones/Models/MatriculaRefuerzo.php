<?php

declare(strict_types=1);

namespace App\Modules\Migraciones\Models;

use App\Modules\Academico\Models\Curso;
use App\Modules\Academico\Models\Horario;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Models\Matricula;
use App\Modules\Migraciones\Database\Factories\MatriculaRefuerzoFactory;
use App\Modules\Migraciones\Enums\EstadoRefuerzoEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Un curso que un estudiante está repitiendo porque lo desaprobó en un
 * ciclo anterior, colgado de la matrícula a la que avanzó -- no de una
 * matrícula aparte (MatriculaService::existeParaEstudianteYCiclo() no
 * permite dos matrículas del mismo estudiante en el mismo ciclo académico).
 * Ver Matricula::todosLosHorarios() para cómo se integra con el resto del
 * sistema.
 *
 * @property int $id
 * @property int $matricula_id
 * @property int $curso_id
 * @property int|null $horario_id
 * @property EstadoRefuerzoEnum $estado
 * @property int|null $matricula_origen_id
 * @property-read Matricula $matricula
 * @property-read Curso $curso
 * @property-read Horario|null $horario
 * @property-read Matricula|null $matriculaOrigen
 */
class MatriculaRefuerzo extends Model
{
    /** @use HasFactory<MatriculaRefuerzoFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'matricula_id',
        'curso_id',
        'horario_id',
        'estado',
        'matricula_origen_id',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoRefuerzoEnum::class,
        ];
    }

    protected static function newFactory(): MatriculaRefuerzoFactory
    {
        return MatriculaRefuerzoFactory::new();
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class);
    }

    public function matriculaOrigen(): BelongsTo
    {
        return $this->belongsTo(Matricula::class, 'matricula_origen_id');
    }
}
