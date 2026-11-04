<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Models;

use App\Models\User;
use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Database\Factories\ComportamientoFactory;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Models\Estudiante;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Nota de comportamiento (AA) del estudiante en un curso: aparte del
 * Promedio Final, solo informativa -- no se combina con P1/P2.
 *
 * @property int $id
 * @property int $horario_id
 * @property int $estudiante_id
 * @property float $nota_numerica
 * @property-read Horario $horario
 * @property-read Estudiante $estudiante
 */
class Comportamiento extends Model
{
    /** @use HasFactory<ComportamientoFactory> */
    use Auditable, HasFactory;

    protected $table = 'comportamientos';

    protected $fillable = [
        'horario_id',
        'estudiante_id',
        'nota_numerica',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'nota_numerica' => 'decimal:2',
        ];
    }

    protected static function newFactory(): ComportamientoFactory
    {
        return ComportamientoFactory::new();
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class);
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
