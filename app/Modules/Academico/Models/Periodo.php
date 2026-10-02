<?php

declare(strict_types=1);

namespace App\Modules\Academico\Models;

use App\Modules\Academico\Database\Factories\PeriodoFactory;
use App\Modules\Academico\Enums\EstadoCicloEnum;
use App\Modules\Academico\Enums\TipoPeriodoEnum;
use App\Modules\Identidad\Support\Auditable;
use App\Modules\Matricula\Models\Matricula;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * El periodo de matrícula del año (1.er periodo, 2.° periodo) -- desde que
 * se retiró el Ciclo rotativo de 4 ventanas, este es el eje real que usan
 * Horarios/Aulas/Matrículas: cada Periodo tiene siempre un Ciclo real
 * detrás (ver ciclo(), creado/sincronizado por PeriodoService). La tabla
 * sigue llamándose `siagies` (y la columna FK `siagie_id`) porque es
 * cosmético renombrar la clase/UI, no el esquema -- ver el plan de
 * migración Grado->Carrera+Ciclo.
 *
 * @property int $id
 * @property TipoPeriodoEnum $tipo
 * @property int $anio
 * @property Carbon|null $fecha_inicio
 * @property Carbon|null $fecha_fin
 * @property EstadoCicloEnum $estado
 * @property-read Ciclo|null $ciclo
 */
class Periodo extends Model
{
    /** @use HasFactory<PeriodoFactory> */
    use Auditable, HasFactory;

    protected $table = 'siagies';

    protected $fillable = [
        'tipo',
        'anio',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoPeriodoEnum::class,
            'estado' => EstadoCicloEnum::class,
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
        ];
    }

    protected static function newFactory(): PeriodoFactory
    {
        return PeriodoFactory::new();
    }

    /**
     * El Ciclo real que le corresponde a este Periodo -- ahí es donde
     * viven sus Horarios/Matrículas (ver PeriodoService::crear()).
     *
     * @return HasOne<Ciclo, $this>
     */
    public function ciclo(): HasOne
    {
        return $this->hasOne(Ciclo::class, 'siagie_id');
    }

    /**
     * @return HasMany<Matricula, $this>
     */
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'siagie_id');
    }

    /**
     * Texto para mostrar (p. ej. "2026-1", "2026-2").
     */
    public function nombreCompleto(): string
    {
        return "{$this->anio}-{$this->numeroDePeriodo()}";
    }

    private function numeroDePeriodo(): string
    {
        return match ($this->tipo) {
            TipoPeriodoEnum::PRIMERO => '1',
            TipoPeriodoEnum::SEGUNDO => '2',
        };
    }
}
