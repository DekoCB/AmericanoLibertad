<?php

declare(strict_types=1);

namespace App\Modules\Academico\Models;

use App\Modules\Academico\Database\Factories\AulaFactory;
use App\Modules\Identidad\Support\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un aula, opcionalmente atada a un Ciclo(Grupo) y a una letra -- resabio de
 * cuando existían solo 2 secciones fijas (A/B) para los 4 grados del viejo
 * modelo EBA. Con Carrera reemplazando a Grado ya no hay una sección fija:
 * las aulas quedan libres, cualquiera se puede asignar a cualquier horario.
 * `letra` se deja sin usar (nullable) por si el instituto igual nombra sus
 * aulas con letras, pero ningún código depende ya de su valor.
 *

 * @property int $id
 * @property int|null $ciclo_id
 * @property string|null $letra
 * @property string $nombre
 * @property-read Ciclo|null $ciclo
 */
class Aula extends Model
{
    /** @use HasFactory<AulaFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'ciclo_id',
        'letra',
        'nombre',
        'capacidad',
        'ubicacion',
        'activa',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
        ];
    }

    protected static function newFactory(): AulaFactory
    {
        return AulaFactory::new();
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(Ciclo::class);
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class);
    }
}
