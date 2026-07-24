<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Egreso extends Model
{
    /** @use HasFactory<\Database\Factories\EgresoFactory> */
    use HasFactory;

    protected $fillable = [
        'concepto',
        'categoria',
        'monto',
        'fecha',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function registrosHoras(): HasMany
    {
        return $this->hasMany(RegistroHoras::class);
    }
}
