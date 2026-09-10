<?php

declare(strict_types=1);

namespace App\Modules\Matricula\Models;

use App\Models\Carrera;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Database\Factories\ExamenUbicacionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $fecha
 * @property float $costo
 * @property string|null $resultado
 */
class ExamenUbicacion extends Model
{
    /** @use HasFactory<ExamenUbicacionFactory> */
    use Auditable, HasFactory;

    protected $table = 'examenes_ubicacion';

    protected $fillable = [
        'estudiante_id',
        'fecha',
        'costo',
        'resultado',
        'carrera_asignada_id',
        'ciclo_asignado',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'costo' => 'decimal:2',
        ];
    }

    protected static function newFactory(): ExamenUbicacionFactory
    {
        return ExamenUbicacionFactory::new();
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class);
    }

    public function carreraAsignada(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_asignada_id');
    }
}
