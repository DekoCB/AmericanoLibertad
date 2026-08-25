<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cuota extends Model
{
    /** @use HasFactory<\Database\Factories\CuotaFactory> */
    use HasFactory;

    protected $fillable = [
        'matricula_id',
        'tipo',
        'mes',
        'monto_programado',
        'monto_pagado',
        'fecha_vencimiento',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_vencimiento' => 'date',
            'monto_programado' => 'float',
            'monto_pagado' => 'float',
        ];
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function saldoRestante(): float
    {
        return round((float) $this->monto_programado - (float) $this->monto_pagado, 2);
    }

    public function actualizarEstado(): void
    {
        $saldo = $this->saldoRestante();

        if ($saldo <= 0) {
            $this->estado = 'pagado';
        } elseif ($this->monto_pagado > 0) {
            $this->estado = 'parcial';
        } elseif ($this->fecha_vencimiento && $this->fecha_vencimiento->isPast()) {
            $this->estado = 'vencido';
        } else {
            $this->estado = 'pendiente';
        }

        $this->save();
    }

    /**
     * Aplica un abono al saldo de la cuota y recalcula su estado.
     */
    public function registrarAbono(float $monto): void
    {
        $this->monto_pagado += $monto;
        $this->actualizarEstado();
    }
}
