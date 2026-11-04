<?php

declare(strict_types=1);

namespace App\Modules\Evaluaciones\Models;

use App\Modules\Academico\Models\Horario;
use App\Modules\Evaluaciones\Database\Factories\EvaluacionFactory;
use App\Modules\Evaluaciones\Enums\EstadoEvaluacionEnum;
use App\Modules\Evaluaciones\Enums\MitadCicloEnum;
use App\Modules\Evaluaciones\Enums\TipoEvaluacionEnum;
use App\Modules\Identidad\Support\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $horario_id
 * @property TipoEvaluacionEnum $tipo
 * @property MitadCicloEnum $mitad
 * @property string|null $nombre
 * @property Carbon|null $fecha
 * @property string|null $enlace_externo
 * @property Carbon|null $disponible_hasta
 * @property EstadoEvaluacionEnum $estado
 * @property-read Horario $horario
 */
class Evaluacion extends Model
{
    /** @use HasFactory<EvaluacionFactory> */
    use Auditable, HasFactory;

    protected $table = 'evaluaciones';

    protected $fillable = [
        'horario_id',
        'tipo',
        'mitad',
        'nombre',
        'fecha',
        'enlace_externo',
        'disponible_hasta',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoEvaluacionEnum::class,
            'mitad' => MitadCicloEnum::class,
            'fecha' => 'date',
            'disponible_hasta' => 'datetime',
            'estado' => EstadoEvaluacionEnum::class,
        ];
    }

    protected static function newFactory(): EvaluacionFactory
    {
        return EvaluacionFactory::new();
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class);
    }

    /**
     * @return HasMany<Calificacion, $this>
     */
    public function calificaciones(): HasMany
    {
        return $this->hasMany(Calificacion::class);
    }

    /**
     * El Examen no tiene nombre propio: siempre se llama "Examen parcial" o
     * "Examen final" según la mitad (ver MitadCicloEnum::examenLabel()).
     * Una Continua sí lo trae (ej. "C1", o lo que haya puesto el docente).
     */
    public function nombre(): string
    {
        return $this->tipo === TipoEvaluacionEnum::EXAMEN
            ? $this->mitad->examenLabel()
            : ($this->attributes['nombre'] ?? 'Continua');
    }

    public function esContinua(): bool
    {
        return $this->tipo === TipoEvaluacionEnum::CONTINUA;
    }

    public function estaPublicada(): bool
    {
        return $this->estado === EstadoEvaluacionEnum::PUBLICADA;
    }

    public function tieneEnlaceExterno(): bool
    {
        return $this->enlace_externo !== null;
    }

    /**
     * El enlace externo solo puede resolverse si la evaluación ya está
     * publicada y, si el docente puso una fecha límite, todavía no pasó.
     */
    public function enlaceDisponible(): bool
    {
        if (! $this->estaPublicada() || ! $this->tieneEnlaceExterno()) {
            return false;
        }

        return $this->disponible_hasta === null || now()->lte($this->disponible_hasta);
    }
}
