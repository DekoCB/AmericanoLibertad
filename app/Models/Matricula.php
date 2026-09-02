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
        'monto_pension',
        'fecha_matricula',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_matricula' => 'date',
            'monto_matricula' => 'float',
            'monto_pension' => 'float',
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
     * Tarifario institucional de la pensión mensual (editable por matrícula).
     */
    public static function montoPensionSugerida(): float
    {
        return 150.0;
    }

    /**
     * Genera las cuotas de pensión que falten para completar el plan de 4
     * (una por cada uno de los 4 meses siguientes a la matrícula). Idempotente:
     * si ya existe una cuota de pensión vencida ese mismo mes, no la duplica —
     * esto permite tanto la creación automática al matricular como el backfill
     * sobre matrículas antiguas sin generar cuotas repetidas.
     */
    public function generarCuotasPension(float $montoPension): int
    {
        $existentes = $this->cuotas()
            ->where('tipo', 'pension')
            ->get()
            ->map(fn (Cuota $cuota) => $cuota->fecha_vencimiento?->format('Y-m'))
            ->filter()
            ->all();

        $creadas = 0;

        for ($n = 1; $n <= 4; $n++) {
            $vencimiento = $this->fecha_matricula->copy()->addMonths($n);

            if (in_array($vencimiento->format('Y-m'), $existentes, true)) {
                continue;
            }

            $cuota = $this->cuotas()->create([
                'tipo' => 'pension',
                'mes' => Cuota::nombreMes($vencimiento),
                'monto_programado' => $montoPension,
                'monto_pagado' => 0,
                'fecha_vencimiento' => $vencimiento,
                'estado' => 'pendiente',
            ]);

            // Si la matrícula es antigua (backfill), el vencimiento recién
            // calculado puede caer en el pasado: se recalcula de una vez para
            // que quede "vencido" en vez de "pendiente" incorrectamente.
            $cuota->actualizarEstado();

            $creadas++;
        }

        if ($creadas > 0) {
            $this->recalcularEstado();
        }

        return $creadas;
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
