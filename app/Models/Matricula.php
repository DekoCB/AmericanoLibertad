<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Matricula extends Model
{
    /** @use HasFactory<\Database\Factories\MatriculaFactory> */
    use HasFactory;

    protected $fillable = [
        'student_id',
        'carrera_id',
        'ciclo',
        'turno',
        'period',
        'periodo_academico_id',
        'monto_matricula',
        'fecha_matricula',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_matricula' => 'date',
            'monto_matricula' => 'float',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }

    public function periodoAcademico(): BelongsTo
    {
        return $this->belongsTo(PeriodoAcademico::class);
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(Cuota::class);
    }

    public function historiales(): HasMany
    {
        return $this->hasMany(HistorialMatricula::class)->latest();
    }

    /**
     * Tarifario: S/ 50 para el primer ciclo, S/ 150 del segundo en adelante.
     */
    public static function montoSugerido(int $ciclo): float
    {
        return $ciclo === 1 ? 50.0 : 150.0;
    }

    /**
     * Recalcula el estado de la matrícula a partir del estado agregado de sus cuotas.
     */
    public function recalcularEstado(): void
    {
        $cuotas = $this->cuotas()->get();

        if ($cuotas->every(fn (Cuota $cuota) => $cuota->estado === 'pagado')) {
            $this->estado = 'pagado';
        } elseif ($cuotas->contains(fn (Cuota $cuota) => in_array($cuota->estado, ['parcial', 'pagado'], true))) {
            $this->estado = 'parcial';
        } elseif ($cuotas->contains(fn (Cuota $cuota) => $cuota->estado === 'vencido')) {
            $this->estado = 'vencido';
        } else {
            $this->estado = 'pendiente';
        }

        $this->save();
    }
}
